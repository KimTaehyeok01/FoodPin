# Feature: Auth (인증)

---

## 개요

일반 이메일/비밀번호 로그인과 카카오·네이버 소셜 로그인을 지원한다.
모든 인증 방식은 최종적으로 자체 JWT를 발급하며, 프론트엔드는 이 토큰으로 API를 호출한다.

---

## 관련 파일

### 백엔드
| 파일 | 역할 |
| ---- | ---- |
| `backend/src/auth/auth.module.ts` | Passport, JWT 설정 + JwtModule export |
| `backend/src/auth/auth.service.ts` | 로그인·회원가입·토큰 생성 로직 |
| `backend/src/auth/auth.controller.ts` | /auth/* 엔드포인트 |
| `backend/src/auth/strategies/jwt.strategy.ts` | Bearer 토큰 검증 |
| `backend/src/auth/strategies/kakao.strategy.ts` | 카카오 OAuth 처리 |
| `backend/src/auth/strategies/naver.strategy.ts` | 네이버 OAuth 처리 |
| `backend/src/auth/guards/jwt-auth.guard.ts` | JWT 인증 Guard |
| `backend/src/auth/dto/register.dto.ts` | 회원가입 DTO |
| `backend/src/auth/dto/login.dto.ts` | 로그인 DTO |

### 프론트엔드
| 파일 | 역할 |
| ---- | ---- |
| `frontend/src/pages/auth/OnboardingPage.tsx` | 최초 실행 온보딩 |
| `frontend/src/pages/auth/LoginPage.tsx` | 로그인 화면 |
| `frontend/src/pages/auth/RegisterPage.tsx` | 회원가입 화면 |
| `frontend/src/pages/auth/AuthCallback.tsx` | 소셜 로그인 후 토큰 수신 |
| `frontend/src/App.tsx` | PrivateRoute 구현 |

---

## 회원가입 (일반)

**엔드포인트:** `POST /auth/register` (rate limit 5회/분)

**DTO 필드**
- `email: string` — `@IsEmail()`
- `password: string` — `@IsString()`, 8자 이상
- `name: string` — `@IsString()`, 실명 (필수)
- `nickname: string` — `@IsString()`, 앱에서 사용할 이름 (필수)
- `address: string` — `@IsString()`, 주소 (필수)
- `age: number` — `@IsInt()` 1~120 (필수)
- `gender: 'male' | 'female'` — `@IsIn(GENDERS)` (필수)
- `favoriteCategories?: string[]` — `@IsOptional()`

`address`, `age`, `gender`는 회원가입 시에는 필수지만, DB 컬럼 자체는 nullable이다 (소셜 로그인 유저는 값이 없기 때문). 상세 → [docs/erd.md](../docs/erd.md#nullable-컬럼-주의)

**서비스 로직**
1. `email` 중복 확인 → `ConflictException('이미 사용 중인 이메일입니다.')`
2. `bcrypt.hash(password, 10)` 해싱
3. User 저장 (name, nickname, address, age, gender 모두 저장) — 저장 시 `email` 유니크 위반(race)이 나면 동일한 `ConflictException`(409)으로 변환
4. 즐겨찾는 카테고리가 있으면 `user_favorite_category` 테이블에 저장
5. `generateToken(user)` → `{ token }`

### 이메일 중복 확인 (회원가입 1단계)

**엔드포인트:** `GET /auth/check-email?email={email}` (rate limit 20회/분)

프론트엔드 회원가입 폼은 3단계로 구성된다 (기본 정보 → 추가 정보 → 선호 음식).
이메일 중복 확인은 **1단계(기본 정보) 입력 완료 후, 2단계로 넘어가기 전**에 수행한다.
이렇게 하면 유저가 주소·나이·성별·선호음식까지 다 입력한 뒤에야 이메일이 이미 사용 중이라는 걸 알게 되는 문제를 방지한다.

```typescript
// authService.isEmailAvailable(email) → boolean
// 컨트롤러: GET /auth/check-email → { available: boolean }
```

실제 가입(`POST /auth/register`) 시에도 동일한 중복 체크를 한 번 더 수행하고, 그 사이를 뚫은 race는 DB의 `email` 유니크 제약이 막는다 (유니크 위반 → 409 변환).

### 주소 입력 (다음 우편번호 서비스)

회원가입 2단계에서 주소는 직접 타이핑하지 않고, **다음(Daum) 우편번호 검색 팝업**으로 선택한다.

```typescript
// 스크립트: https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js (API 키 불필요)
new daum.Postcode({
  oncomplete: (data) => setForm((f) => ({ ...f, address: data.address })),
}).embed(containerElement);
```

- 모달 오버레이 내부에 `embed()`로 삽입 (새 창을 띄우지 않음 — 팝업 차단 이슈 회피)
- 타입 선언: `frontend/src/types/daum-postcode.d.ts`

---

## 로그인 (일반)

**엔드포인트:** `POST /auth/login` (`@HttpCode(200)`, rate limit 5회/분)

**DTO 필드**
- `email: string`
- `password: string`

**서비스 로직**
1. `email`로 유저 조회 → 없으면 `UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.')`
2. `bcrypt.compare(password, user.password)` → 불일치 시 동일 메시지
3. `generateToken(user)` → `{ token }` — 정지(`isBanned`) 계정은 여기서 `UnauthorizedException('정지된 계정입니다.')` (관리자·소셜 로그인도 동일 지점에서 차단)

---

## 소셜 로그인 (카카오 / 네이버)

**흐름**

```
프론트 window.location.href = `${API_URL}/auth/kakao`
  → AuthGuard('kakao') → 카카오 리다이렉트
  → 카카오 인증 완료 → GET /auth/kakao/callback
  → KakaoStrategy.validate() → authService.findOrCreate()
  → JWT 생성 → res.redirect(`${FRONTEND_URL}/auth/callback#token=${jwt}`)
  → AuthCallback 페이지: location.hash에서 token 추출 → localStorage 저장
```

**find-or-create 로직**
- `provider + providerId` 조합으로 유저 식별 — DB에 `@Unique(['provider', 'providerId'])` 제약
- 없으면 자동 회원가입 (nickname, profileImage 소셜 프로필에서 가져옴)
- 있으면 기존 유저 반환
- 동시 콜백(더블클릭 등)으로 insert가 유니크 제약에 걸리면 먼저 생성된 유저를 재조회해서 반환
- 정지(`isBanned`) 계정은 `generateToken`에서 차단 — 리다이렉트 대신 401 JSON 반환

**AuthCallback 구현**
```tsx
// URL fragment에서 토큰 추출
const hash = window.location.hash;  // '#token=eyJ...'
const token = hash.replace('#token=', '');
localStorage.setItem('token', token);
// 프로필 완성 여부 확인 후 분기 (아래 참고)
```

---

## 소셜 로그인 프로필 완성

카카오/네이버 프로필에는 `nickname`, `profileImage`만 있고 `name`(실명)·`address`·`age`·`gender`가 없다.
일반 회원가입은 이 필드들을 필수로 받기 때문에, 가입 경로에 따라 데이터 완성도가 달라지는 걸 막기 위해
소셜 로그인도 최초(또는 미완성 상태)에는 반드시 이 필드들을 채우게 한 뒤에만 앱에 진입시킨다.

**흐름**
```
AuthCallback: localStorage에 token 저장
  → usersApi.getMe() 호출
  → name/address/age/gender 중 하나라도 비어있으면 → navigate('/complete-profile')
  → 모두 채워져 있으면 → navigate('/')
```

**CompleteProfilePage** (`frontend/src/pages/auth/CompleteProfilePage.tsx`)
- 뒤로가기 없음 — 필수 입력이므로 건너뛸 수 없다
- 진입 시 `usersApi.getMe()`로 카카오/네이버 프로필의 닉네임을 기본값으로 채워둠 (그 자리에서 바로 수정 가능)
- 필드: 이름(필수), 닉네임(필수, 소셜 프로필 값이 기본 채워짐), 주소(다음 우편번호 팝업, 필수), 나이(필수), 성별(필수), 선호 음식(선택)
- 제출 시 `usersApi.updateProfile({ name, nickname, address, age, gender, favoriteCategories })` → `PATCH /users/me`
- 성공 시 `navigate('/', { replace: true })`

**재로그인 시 처리:** 이미 완성된 유저는 매번 `getMe()`로 확인만 하고 바로 홈으로 이동한다.
과거에 이 페이지를 건너뛴(완성하지 않은) 유저는 다음 로그인 때도 다시 `/complete-profile`로 보내진다 — 영구적으로 우회할 수 없다.

**알려진 한계:** `/complete-profile`은 `PrivateRoute` 밖에 있어(로그인 직후 접근 전용 라우트라 `AuthCallback`과 동일하게 취급), 토큰 없이 URL을 직접 입력해도 페이지 자체는 열린다. 다만 이 경우 저장 API 호출이 401로 실패해 에러 메시지만 뜨고 실질적인 피해는 없다.

## JWT 토큰

```typescript
// 생성 — 모든 발급 경로(일반·관리자·소셜)가 이 메서드를 거치며, 정지 계정은 여기서 차단
generateToken(user: User): string {
  if (user.isBanned) throw new UnauthorizedException('정지된 계정입니다.');
  return this.jwtService.sign({ sub: user.id });
}

// payload: { sub: number }  ← user.id만 포함
// 만료: 30일
```

토큰 검증(`JwtStrategy.validate`)은 `password`를 제외하고 유저를 조회해 `req.user`에 싣는다 — 상세는 [docs/security.md](../docs/security.md#jwt) 참고.

---

## PrivateRoute

```tsx
function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  if (token) return <>{children}</>;
  const seen = localStorage.getItem('onboarding_seen');
  return <Navigate to={seen ? '/login' : '/onboarding'} replace />;
}
```

- `onboarding_seen`: 온보딩 완료 여부. 최초 진입 시 온보딩, 이후 로그인 페이지로.

---

## 온보딩

- `localStorage.getItem('onboarding_seen')` 로 최초 실행 여부 확인
- 온보딩 완료 시 `localStorage.setItem('onboarding_seen', 'true')`

---

## 갱신 트리거

이 파일을 갱신해야 하는 경우.
- 새 소셜 로그인 공급자 추가 시
- 토큰 만료 정책 변경 시
- 회원가입 필드 추가 시
- Refresh Token 도입 시
