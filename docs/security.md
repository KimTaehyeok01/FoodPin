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
async validate(payload: { sub: number }): Promise<AuthUser> {
  const user = await this.userRepository.findOne({
    where: { id: payload.sub },
    select: { id: true, nickname: true, email: true, role: true, isBanned: true },
  });
  if (!user) throw new UnauthorizedException();
  if (user.isBanned) throw new UnauthorizedException('정지된 계정입니다.');

  // Entity가 아니라 AuthUser 순수 타입으로 반환한다
  return { id: user.id, nickname: user.nickname, email: user.email, role: user.role, isBanned: user.isBanned };
}
```

매 요청마다 DB를 조회하여 유저 존재·정지 여부를 확인한다. 탈퇴한 유저의 토큰은 즉시 무효화.

`req.user`에는 **`User` Entity가 아니라 `AuthUser` 5필드**만 담긴다. 소비처가 실제로 쓰는 값만 추린 것이라 `password`는 물론 `providerId`·`address` 같은 불필요한 PII도 요청 컨텍스트에 올라가지 않는다. 컨트롤러는 `@Req() req: AuthRequest`로 받는다.

| 필드 | 소비처 |
| ---- | ------ |
| `id` | 전 도메인 소유자 판별 |
| `role` | `AdminGuard`, 식당 수정 권한 |
| `isBanned` | `issueToken`의 정지 계정 차단 |
| `nickname`·`email` | `GET /v1/auth/admin/me` 응답 |

### 토큰 발급 차단 (정지 계정)

```typescript
// auth.service.ts — 모든 발급 경로(일반·관리자·소셜)가 이 메서드를 거친다
issueToken(user: AuthUser): string {
  if (user.isBanned) throw new UnauthorizedException('정지된 계정입니다.');
  return this.jwtService.sign({ sub: user.id });
}
```

정지된 유저는 일반 로그인·관리자 로그인·소셜 콜백 어디서든 토큰 발급 자체가 거부된다(401).
소셜 콜백의 경우 리다이렉트 대신 401 JSON이 반환된다.

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
    try {
      user = await this.userRepo.save(this.userRepo.create({ ...profile }));
    } catch (err) {
      // 동시 콜백 race: 유니크 제약(ER_DUP_ENTRY)에 걸리면 먼저 생성된 유저를 재조회
      if (!this.isDuplicateError(err)) throw err;
      user = await this.userRepo.findOneByOrFail({ ... });
    }
  }
  return user;
}
```

`user` 테이블의 `@Unique(['provider', 'providerId'])` 제약이 동시 콜백(더블클릭 등)으로 같은 소셜 계정의 유저가 2개 생기는 것을 DB 레벨에서 막고, 서비스는 유니크 위반 시 재조회로 복구한다.

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
- 회원가입 시 `email` 유니크 위반(check-email과 register 사이 race)은 `ConflictException`(409)으로 변환 — 500 노출 없음

---

## Rate Limiting (@nestjs/throttler)

`ThrottlerGuard`를 인증 관련 엔드포인트에 개별 적용한다 (전역 가드 아님 — 미적용 엔드포인트는 제한 없음).

| 엔드포인트 | 제한 | 목적 |
| ---------- | ---- | ---- |
| GET /v1/auth/check-email | 20회/분 | 이메일 열거(enumeration) 방지 |
| POST /v1/auth/register | 5회/분 | 이메일 열거 방지 + bcrypt 부하 공격 방지 |
| POST /v1/auth/login | 5회/분 | 브루트포스 방지 |
| POST /v1/auth/admin/login | 5회/분 | 브루트포스 방지 |

초과 시 `429 Too Many Requests`.

---

## 파일 업로드

업로드 정책은 `upload/upload.options.ts`에 순수 함수로 분리돼 있다 (컨트롤러 인라인 아님 — 단위 테스트 가능).

```typescript
// 확장자와 MIME 타입을 함께 검사 — 둘 중 하나만 통과하는 위장 업로드를 막는다
export function isAllowedImage(originalName: string, mimetype: string): boolean {
  const ext = extname(originalName).toLowerCase();
  return /^image\//.test(mimetype) && ALLOWED_EXTENSIONS.includes(ext);
}

export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;  // 10MB

// 원본 파일명을 버리고 충돌하지 않는 이름을 만든다 (경로 조작·한글 파일명 문제 회피)
export function buildStoredFilename(originalName: string): string {
  return `${Date.now()}-${Math.round(Math.random() * 1e6)}${extname(originalName)}`;
}
```

- 저장 위치: `./uploads`
- 업로드 엔드포인트: `JwtAuthGuard` 적용 (인증된 유저만 업로드 가능)
- 파일 서빙: `/uploads/*`와 `/v1/uploads/*` — 인증 없이 접근 가능 (정적 파일)
- 응답 URL에는 `/v1`을 붙이지 않는다 (`{ url: '/uploads/{filename}' }`) — 프런트가 `VITE_API_URL`과 이어 붙이기 때문

---

## 소유권 인가 (Authorization)

### Restaurant 수정/삭제

```typescript
// 소유자 본인만 수정·삭제 가능. 소유자 없는(시드) 식당은 관리자만 가능
const allowed =
  restaurant.userId === null ? user.role === 'admin' : restaurant.userId === user.id;
if (!allowed) throw new ForbiddenException(message);
```

`userId: null` 레코드(시드 데이터)는 `role === 'admin'`인 유저만 수정·삭제할 수 있다.

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

## API 문서 노출 (Swagger)

`GET /docs`는 **개발 환경에서만** 제공된다.

```typescript
// main.ts
if (process.env.NODE_ENV !== 'production') {
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
}
```

운영에서 닫아두는 이유. 관리자 전용 엔드포인트(`/v1/admin/*`) 목록과 전체 DTO 스키마가 공개되면 공격자가 엔드포인트를 탐색할 필요 없이 공격 표면을 파악할 수 있다. 포트폴리오 목적으로 외부에 공개하려면 Basic Auth 게이트를 함께 붙여야 한다.

Entity에는 `@ApiProperty`를 부착하지 않는다. Entity를 스키마로 노출하면 내부 컬럼 구조가 그대로 드러나고, `synchronize: true` 환경에서 Entity 데코레이터 변경은 스키마 재생성을 유발한다.

---

## 민감정보 유출 방어

### 응답 계층

Service는 Entity를 반환하지 않고 **Response DTO**를 반환한다 (`dto/{domain}.response.dto.ts`).

이전에는 `select` 목록(`PROFILE_SELECT`, `USER_LIST_SELECT`)으로 `password` 등을 제외했는데, 이 방식은 누가 select 한 줄만 지워도 비밀번호 해시가 응답에 실릴 수 있다. DTO에 선언되지 않은 필드는 구조적으로 나갈 수 없다.

인증 주체도 `User` Entity가 아니라 `AuthUser`(id·nickname·email·role·isBanned) 5필드만 요청 컨텍스트에 싣는다. `jwt.strategy`의 select가 이 5개로 축소돼 있어 불필요한 PII가 메모리에 올라가지 않는다.

### 로그

`common/utils/mask.util.ts`의 `maskEmail`·`maskName`을 거친다.

| 함수 | 규칙 | 예 |
| ---- | ---- | -- |
| `maskEmail` | `@` 앞 2자리만 노출 | `hong@a.com` → `ho***@a.com` |
| `maskName` | 첫/끝 글자만 | `홍길동` → `홍*동` |

**로그 출력 금지 항목.** `password`(평문·해시), JWT `token`, `providerId`, OAuth 시크릿, `address`. 가능하면 `userId`만 남긴다.

TypeORM 쿼리 로깅(`logging`)은 `false`를 유지한다. 켜면 쿼리 파라미터에 이메일과 비밀번호 해시가 평문으로 찍힌다.

---

## 알려진 보안 한계

| 항목 | 현황 | 개선 방향 |
| ---- | ---- | --------- |
| 토큰 저장 | localStorage (XSS 취약) | httpOnly 쿠키로 전환 고려 |
| 토큰 갱신 | 갱신(refresh) 없음, 30일 만료 | Refresh Token 도입 고려 |
| 알림 실시간성 | 접속 시점에 계산 (push 없음) | 추후 WebSocket 또는 FCM 고려 |
| 스키마 관리 | `synchronize: true` (개발 전용) | 운영 배포 전 마이그레이션 전환 필수 |

---

## 갱신 트리거

이 파일을 갱신해야 하는 경우.
- 인증/인가 방식 변경 시
- 새 OAuth 공급자 추가 시
- 파일 업로드 제한 변경 시
- 보안 정책 개선 시
