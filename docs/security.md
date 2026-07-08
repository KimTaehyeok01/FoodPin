# Security

실제 구현 기반으로 정리한 보안 패턴 및 제약사항.

---

## JWT

### 설정

```typescript
JwtModule.registerAsync({
  useFactory: (config: ConfigService) => ({
    secret: config.get('JWT_SECRET'),
    signOptions: { expiresIn: '30d' },
  }),
})
```

- Secret: 환경변수 `JWT_SECRET` (미설정 시 서버 시작 가능하나 보안 취약)
- 만료: 30일
- Payload: `{ sub: user.id }` — 최소 정보만 포함 (email, role 등 미포함)

### 검증 흐름

```typescript
// jwt.strategy.ts
async validate(payload: { sub: number }) {
  const user = await this.userRepository.findOneBy({ id: payload.sub });
  if (!user) throw new UnauthorizedException();
  return user;  // → req.user
}
```

매 요청마다 DB를 조회하여 유저 존재 여부를 확인한다. 탈퇴한 유저의 토큰은 즉시 무효화.

### 프론트엔드 토큰 저장

```typescript
localStorage.setItem('token', token);
```

- `localStorage` 저장 (httpOnly 쿠키 미사용)
- **주의:** XSS 취약 시 토큰 탈취 가능. 현재 프로젝트 범위에서 수용
- `PrivateRoute`: `localStorage.getItem('token')` 유무로만 접근 제어 (토큰 유효성은 API 호출 시 401로 감지)

---

## OAuth2

### 카카오

```typescript
// 환경변수
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
KAKAO_CALLBACK_URL=http://localhost:3000/auth/kakao/callback

// 라이브러리: passport-kakao
// find-or-create: provider='kakao' + providerId로 유저 식별
```

### 네이버

```typescript
// 환경변수
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
NAVER_CALLBACK_URL=http://localhost:3000/auth/naver/callback

// 라이브러리: passport-naver-v2
// find-or-create: provider='naver' + providerId로 유저 식별
```

### find-or-create 패턴

```typescript
async findOrCreate(profile: { provider, providerId, nickname, profileImage }) {
  let user = await this.userRepo.findOneBy({
    provider: profile.provider,
    providerId: profile.providerId,
  });
  if (!user) {
    user = this.userRepo.create({ ...profile });
    await this.userRepo.save(user);
  }
  return user;
}
```

### 토큰 전달 방식

소셜 로그인 성공 후 프론트엔드에 JWT를 URL fragment로 전달.

```
redirect → {FRONTEND_URL}/auth/callback#token={jwt}
```

**선택 이유**
- HTTP 리다이렉트 시 query string은 서버 액세스 로그에 기록됨
- URL fragment(`#`)는 서버로 전송되지 않음
- 소셜 OAuth 액세스 토큰은 백엔드에만 머물고 프론트에 노출되지 않음

---

## 비밀번호

```typescript
// 해싱 (saltRounds = 10)
const hash = await bcrypt.hash(dto.password, 10);

// 검증
const valid = await bcrypt.compare(dto.password, user.password);
if (!valid) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
```

- 소셜 로그인 유저: `password: null`, `email: null`
- 소셜 유저가 일반 로그인 시도 시: `password`가 null이므로 `bcrypt.compare` 실패 → 401

---

## 파일 업로드

```typescript
// 허용 MIME 타입
if (!file.mimetype.match(/^image\//)) {
  throw new BadRequestException('이미지 파일만 업로드 가능합니다.');
}

// 크기 제한
limits: { fileSize: 10 * 1024 * 1024 }  // 10MB

// 파일명 난수화 (원본 파일명 미사용)
filename: `${Date.now()}-${Math.round(Math.random() * 1e6)}${extname(file.originalname)}`

// 저장 위치
destination: './uploads'
```

- 업로드 엔드포인트: `JwtAuthGuard` 적용 (인증된 유저만 업로드 가능)
- 파일 서빙: `/uploads/*` — 인증 없이 접근 가능 (정적 파일)

---

## 소유권 인가 (Authorization)

### Restaurant 수정/삭제

```typescript
// userId가 null이면 공용 레코드로 간주 (누구나 수정 가능 — 주의 필요)
if (restaurant.userId !== null && restaurant.userId !== userId) {
  throw new ForbiddenException('수정 권한이 없습니다.');
}
```

**알려진 한계:** `userId: null` 레코드(시드 데이터 등)는 인증된 누구나 수정·삭제 가능. 추후 정책 명확화 필요.

### Pin

```typescript
// where 조건에 userId 포함 → 타인 핀 접근 원천 차단
const pin = await this.pinRepo.findOneBy({ userId, restaurantId });
if (!pin) throw new NotFoundException('핀을 찾을 수 없습니다.');
```

---

## ValidationPipe (전역)

```typescript
// main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,              // DTO에 없는 필드 자동 제거
    forbidNonWhitelisted: true,   // 허용되지 않은 필드 있으면 400
    transform: true,              // @Param, @Query 타입 자동 변환
  }),
);
```

---

## CORS

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
});
```

---

## 알려진 보안 한계

| 항목 | 현황 | 개선 방향 |
| ---- | ---- | --------- |
| 토큰 저장 | localStorage (XSS 취약) | httpOnly 쿠키로 전환 고려 |
| 토큰 갱신 | 갱신(refresh) 없음, 30일 만료 | Refresh Token 도입 고려 |
| restaurant.userId=null | 공용 레코드로 누구나 수정 가능 | 정책 명확화 또는 관리자 권한 도입 |
| 알림 실시간성 | 접속 시점에 계산 (push 없음) | 추후 WebSocket 또는 FCM 고려 |

---

## 갱신 트리거

이 파일을 갱신해야 하는 경우.
- 인증/인가 방식 변경 시
- 새 OAuth 공급자 추가 시
- 파일 업로드 제한 변경 시
- 보안 정책 개선 시
