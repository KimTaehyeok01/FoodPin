# Architecture

---

## 시스템 구성

```
┌─────────────────────────────────────────┐
│             Browser / App               │
│         React + Vite (5173)             │
└────────────────┬────────────────────────┘
                 │ HTTP / fetch API
                 │ Authorization: Bearer {JWT}
┌────────────────▼────────────────────────┐
│           NestJS Backend (3000)         │
│  ┌──────────────────────────────────┐   │
│  │  Controller → Service → Repo     │   │
│  └──────────────────────────────────┘   │
│  ┌──────────┐  ┌────────┐               │
│  │ Passport │  │ Multer │               │
│  │ JWT/OAuth│  │ Upload │               │
│  └──────────┘  └────────┘               │
└────────────────┬────────────────────────┘
                 │ TypeORM
┌────────────────▼────────────────────────┐
│              MySQL DB                   │
│  restaurant, pin, user,                 │
│  restaurant_menu, user_favorite_category│
└─────────────────────────────────────────┘
         │ 정적 파일 서빙
    /uploads/* (로컬 디스크)
```

---

## 백엔드 레이어 구조

```
Controller  →  Service  →  TypeORM Repository<Entity>
    ↑            │
    └── Response DTO ──┘   (Entity는 Service 밖으로 나가지 않는다)
```

- 별도의 Repository 클래스 계층 없음
- `@InjectRepository(Entity)`로 TypeORM Repository를 Service에 직접 주입
- Module이 의존성 조립 역할 담당

### Entity 캡슐화 규칙

Service의 public 메서드는 **Entity를 반환하거나 파라미터로 받지 않는다.**

- 반환은 `dto/{domain}.response.dto.ts`의 Response DTO로만. 변환은 `static from()` 정적 팩토리 한 곳에서 일어난다.
- Entity를 다루는 조회 헬퍼는 `private`로 둔다 (예: `RestaurantsService.findEntityOrFail`).
- 인증 주체는 `User` Entity가 아니라 `src/common/types/auth-request.ts`의 `AuthUser`(id·nickname·email·role·isBanned)를 쓴다. Controller는 `@Req() req: AuthRequest`로 받는다.
- 예외: `admin`·`notifications`는 자체 Entity가 없는 집계 전용 도메인이라 타 도메인 Repository를 직접 주입한다. 대신 반환은 반드시 Response DTO다.

### 트랜잭션 경계

`DataSource.transaction()` 콜백을 **다중 쓰기가 있는 메서드에만** 선언한다. 조회와 단일 statement 쓰기는 TypeORM autocommit으로 원자적이라 선언하지 않는다.

| 지점 | 이유 |
| ---- | ---- |
| `UsersService.updateProfile` | 프로필 저장 + 선호 카테고리 delete/insert. 분리하면 delete 성공 후 insert 실패 시 카테고리가 전량 소실된다 |
| `AuthService.register` | 유저 저장 + 선호 카테고리 저장. 분리하면 카테고리 없는 유저가 생기는 부분 실패가 가능하다 |

두 가지 함정을 코드 주석과 테스트로 고정해 두었다.

- **콜백 내부에서는 반드시 `manager.getRepository(...)`를 쓴다.** 주입된 Repository는 트랜잭션 밖 커넥션이라 원자성이 사라진다.
- **커밋 이후 조회해야 한다.** `updateProfile`이 `getMe()`를 콜백 안에서 부르면 별도 커넥션이 미커밋 데이터를 못 읽어 카테고리가 빈 배열로 응답된다.
- `bcrypt.hash`는 트랜잭션 밖에 둔다 (CPU 100ms급 작업이 DB 커넥션을 점유하지 않도록).

### 공통 모듈 (`src/common/`)

```
common/
├── types/auth-request.ts               ← AuthUser, AuthRequest
├── utils/mask.util.ts                  ← maskEmail, maskName (로그 PII 마스킹)
├── dto/error.response.dto.ts           ← Swagger 문서화 전용 (런타임 미사용)
└── swagger/api-error-responses.decorator.ts  ← @ApiErrorResponses(400, 404, ...)
```

### 모듈 구성

```
AppModule
├── ConfigModule (isGlobal: true)
├── TypeOrmModule (forRootAsync)
├── AuthModule
│   └── exports: [JwtModule]
├── RestaurantsModule
├── PinsModule
├── UsersModule        ← GET/PATCH /v1/users/me (프로필)
├── NotificationsModule
├── InquiriesModule    ← GET/POST /v1/inquiries (1:1 문의)
├── AdminModule        ← /v1/admin/* (회원·식당·리뷰·문의 관리, AdminGuard)
└── UploadModule
```

### 라우팅 프리픽스

`main.ts`가 `setGlobalPrefix('v1')`로 전 엔드포인트에 `/v1`을 붙인다. **제외 3개**는 `exclude` 옵션으로 레거시 경로를 유지한다.

| 제외 경로 | 이유 |
| --------- | ---- |
| `GET /auth/kakao/callback` | 카카오 개발자 콘솔 등록 Redirect URI와 일치해야 함 |
| `GET /auth/naver/callback` | 네이버 개발자 콘솔 등록 Callback URL과 일치해야 함 |
| `GET /` | 헬스체크성 루트 |

정적 파일은 `useStaticAssets`가 프리픽스 영향을 받지 않으므로 **`/uploads`와 `/v1/uploads` 양쪽에 등록**한다. 프런트가 `${VITE_API_URL}${photoUrl}`로 조립하기 때문에 한쪽만 등록하면 식당 사진이 전부 404가 된다.

### 파일 구조 (도메인별 반복 패턴)

```
{domain}/
├── {domain}.module.ts         ← 모듈 정의 + 엔티티 등록
├── {domain}.controller.ts     ← HTTP 엔드포인트 + Swagger 데코레이터
├── {domain}.service.ts        ← 비즈니스 로직 (Response DTO 반환)
├── {domain}.service.spec.ts   ← Service 단위 테스트 (Repository는 mock)
├── {domain}.entity.ts         ← TypeORM 엔티티
└── dto/
    ├── create-{domain}.dto.ts          ← 요청 DTO (class-validator + @ApiProperty)
    ├── update-{domain}.dto.ts          ← PartialType(@nestjs/swagger)
    ├── {domain}.response.dto.ts        ← 응답 DTO 전체 (static from)
    └── {domain}.response.spec.ts       ← 응답 계약 회귀 테스트
```

`update-*.dto.ts`의 `PartialType`은 `@nestjs/mapped-types`가 아니라 **`@nestjs/swagger`**에서 import한다. mapped-types 판은 `@ApiProperty` 메타데이터를 상속하지 않아 Swagger 스키마가 빈 객체로 나온다 (검증 동작은 두 구현이 동일).

---

## 프론트엔드 라우팅 구조

`App.tsx`의 `AppLayout` 컴포넌트가 두 가지 렌더링 전략을 혼합한다.

### 탭 베이스 페이지 (keep-alive)

항상 마운트, `display: block/none`으로 전환.

```
/         → HomePage
/map      → MapPage   (※ 첫 방문 이후 keep-alive. display:none 중 카카오맵 초기화 방지)
/mypage   → MyPage
```

**MapPage 특수 처리:** `mapMounted` 상태 플래그 — 첫 방문 전까지 마운트 자체를 막고, 이후엔 `display` 로만 전환. 카카오맵은 `display:none` 상태에서 초기화 시 타일이 깨짐.

### 세부 오버레이 페이지 (조건부 마운트)

경로 일치 시만 마운트, 슬라이드-인 오버레이.

```
/restaurants/:id           → RestaurantDetailPage
/restaurants               → RestaurantListPage
/favorites                 → FavoritesPage
/profile-edit              → ProfileEditPage
/badges                    → BadgesPage
/stats                     → StatsPage
/inquiries                 → InquiriesPage
/notifications             → NotificationsPage
/notification-settings     → NotificationSettingsPage
```

**오버레이 CSS 패턴:**
```css
.page {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 68px;
  z-index: 10;
  animation: slide-in 0.36s cubic-bezier(0.22, 1, 0.36, 1);
}
```

**뒤로가기 패턴 (isLeaving):**
```tsx
const [isLeaving, setIsLeaving] = useState(false);

<div
  className={`page${isLeaving ? ' page--leaving' : ''}`}
  onAnimationEnd={(e) => { if (isLeaving && e.target === e.currentTarget) navigate(-1); }}
>
  <button onClick={() => setIsLeaving(true)}>뒤로</button>
```

### 인증 라우트 (공개)

```
/onboarding        → OnboardingPage
/login             → LoginPage
/register          → RegisterPage
/auth/callback     → AuthCallback         ← 소셜 로그인 후 토큰 수신
/complete-profile  → CompleteProfilePage  ← 소셜 로그인 유저의 이름·주소·나이·성별 필수 입력
```

### 관리자 라우트 (일반 유저 흐름과 분리)

```
/admin/login       → AdminLoginPage        ← 이메일+비밀번호만 (소셜 로그인 없음)
/admin             → AdminDashboardPage    ← 요약 통계
/admin/users       → AdminUsersPage        ← 회원 검색·정지/해제·삭제
/admin/restaurants → AdminRestaurantsPage  ← 식당 검색·삭제
/admin/pins        → AdminPinsPage         ← 리뷰 조회·삭제
/admin/inquiries   → AdminInquiriesPage    ← 문의 조회·답변 등록
```

일반 유저 세션(`localStorage.token`)과 완전히 분리된 `localStorage.admin_token`을 사용한다. `AdminRoute`는 토큰 존재 여부만 클라이언트에서 확인하고(`PrivateRoute`와 동일한 패턴), 실제 `role` 검증은 백엔드 `AdminGuard`가 매 요청마다 수행한다. 세부 페이지는 `AdminLayout`(상단 헤더 + 탭 네비게이션) 공통 컴포넌트로 감싼다.

**세션 즉시 무효화:** 회원을 정지(`isBanned`)하거나 삭제하면, 그 유저가 발급받은 기존 JWT도 다음 요청부터 `JwtStrategy`에서 즉시 거부된다(재로그인 필요). 관리자 계정 자신을 정지/삭제해도 동일하게 즉시 로그아웃된다.

### `lastBase` 패턴

오버레이가 닫혔을 때 마지막 탭으로 복귀하기 위해 `lastBase` 상태 유지.

```tsx
const [lastBase, setLastBase] = useState('/');
useEffect(() => {
  if (isBase) setLastBase(location.pathname);
}, [location.pathname, isBase]);
const activeBase = isBase ? location.pathname : lastBase;
```

---

## 인증 흐름

### 일반 로그인

```
1. POST /v1/auth/login { email, password }
2. bcrypt.compare() 검증
3. jwtService.sign({ sub: user.id }) → JWT
4. 프론트: localStorage.setItem('token', token)
5. navigate('/')
```

### 소셜 로그인 (카카오 예시, 네이버 동일)

```
1. 프론트: window.location.href = `${API_URL}/auth/kakao`  (전체 페이지 이동)
2. AuthGuard('kakao') → 카카오 OAuth 리다이렉트
3. 카카오 인증 후 GET /auth/kakao/callback
4. KakaoStrategy.validate() 실행
5. authService.findOrCreate({ provider, providerId, nickname, profileImage })
6. JWT 생성 → res.redirect(`${FRONTEND_URL}/auth/callback#token=${jwt}`)
7. AuthCallback 페이지: window.location.hash에서 token 추출
8. localStorage.setItem('token', token)
9. usersApi.getMe() 호출 → name/address/age/gender 중 하나라도 비어있으면 /complete-profile, 아니면 /
```

**URL fragment 방식 선택 이유:** 서버 로그에 토큰 노출 없음, 서버로 fragment가 전송되지 않음.

**소셜 로그인 프로필 완성 (신규):** 카카오/네이버는 닉네임·프로필사진만 제공하고 이름·주소·나이·성별은 주지 않는다. 일반 회원가입은 이 필드들을 필수로 받으므로, 데이터 일관성을 위해 소셜 로그인도 최초(또는 미완성) 시 `/complete-profile`에서 동일하게 필수 입력을 받은 뒤에만 앱에 진입하게 한다. 상세 → [features/auth.md](../features/auth.md#소셜-로그인-프로필-완성)

### JWT 검증 (매 인증 요청)

```
1. JwtAuthGuard → JwtStrategy
2. ExtractJwt.fromAuthHeaderAsBearerToken()
3. payload.sub (user.id)로 DB 조회 → 없으면 UnauthorizedException
4. 반환된 User → req.user
```

### PrivateRoute (프론트)

```tsx
// localStorage.getItem('token') 유무로만 접근 제어
// 토큰 만료 여부는 API 호출 시 401로 감지
function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  if (token) return <>{children}</>;
  const seen = localStorage.getItem('onboarding_seen');
  return <Navigate to={seen ? '/login' : '/onboarding'} replace />;
}
```

---

## CORS 설정

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL,  // 기본값: http://localhost:5173
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
});
```

---

## 정적 파일 서빙

```typescript
// main.ts
app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads/' });
```

업로드된 이미지는 `backend/uploads/` 디렉토리에 저장되고 `/uploads/{filename}`으로 접근 가능.

---

## 갱신 트리거

이 파일을 갱신해야 하는 경우.
- 새 도메인 모듈 추가 시
- 라우팅 구조 변경 시
- 인증 방식 변경 시
- CORS / 정적 파일 서빙 설정 변경 시
