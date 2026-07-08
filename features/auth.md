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

**엔드포인트:** `POST /auth/register`

**DTO 필드**
- `email: string` — `@IsEmail()`
- `password: string` — `@IsString()`
- `nickname: string` — `@IsString()`
- `favoriteCategories?: string[]` — `@IsOptional()`

**서비스 로직**
1. `email` 중복 확인 → `ConflictException('이미 사용 중인 이메일입니다.')`
2. `bcrypt.hash(password, 10)` 해싱
3. User 저장
4. 즐겨찾는 카테고리가 있으면 `user_favorite_category` 테이블에 저장
5. `generateToken(user)` → `{ token }`

---

## 로그인 (일반)

**엔드포인트:** `POST /auth/login` (`@HttpCode(200)`)

**DTO 필드**
- `email: string`
- `password: string`

**서비스 로직**
1. `email`로 유저 조회 → 없으면 `UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.')`
2. `bcrypt.compare(password, user.password)` → 불일치 시 동일 메시지
3. `generateToken(user)` → `{ token }`

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
- `provider + providerId` 조합으로 유저 식별
- 없으면 자동 회원가입 (nickname, profileImage 소셜 프로필에서 가져옴)
- 있으면 기존 유저 반환

**AuthCallback 구현**
```tsx
// URL fragment에서 토큰 추출
const hash = window.location.hash;  // '#token=eyJ...'
const token = hash.replace('#token=', '');
localStorage.setItem('token', token);
navigate('/');
```

---

## JWT 토큰

```typescript
// 생성
generateToken(user: User): string {
  return this.jwtService.sign({ sub: user.id });
}

// payload: { sub: number }  ← user.id만 포함
// 만료: 30일
```

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
