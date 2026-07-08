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
```

- 별도의 Repository 클래스 계층 없음
- `@InjectRepository(Entity)`로 TypeORM Repository를 Service에 직접 주입
- Module이 의존성 조립 역할 담당

### 모듈 구성

```
AppModule
├── ConfigModule (isGlobal: true)
├── TypeOrmModule (forRootAsync)
├── AuthModule
│   └── exports: [JwtModule]
├── RestaurantsModule
├── PinsModule
├── UsersModule
├── NotificationsModule
└── UploadModule
```

### 파일 구조 (도메인별 반복 패턴)

```
{domain}/
├── {domain}.module.ts         ← 모듈 정의 + 엔티티 등록
├── {domain}.controller.ts     ← HTTP 엔드포인트
├── {domain}.service.ts        ← 비즈니스 로직
├── {domain}.entity.ts         ← TypeORM 엔티티
└── dto/
    ├── create-{domain}.dto.ts
    └── update-{domain}.dto.ts
```

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
/onboarding    → OnboardingPage
/login         → LoginPage
/register      → RegisterPage
/auth/callback → AuthCallback    ← 소셜 로그인 후 토큰 수신
```

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
1. POST /auth/login { email, password }
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
8. localStorage.setItem('token', token) → navigate('/')
```

**URL fragment 방식 선택 이유:** 서버 로그에 토큰 노출 없음, 서버로 fragment가 전송되지 않음.

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
