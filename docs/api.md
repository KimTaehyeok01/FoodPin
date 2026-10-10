# API Reference

Base URL: `http://localhost:3000/v1` (개발) / `{배포 도메인}/v1` (운영)

---

## API 버전 프리픽스

모든 엔드포인트는 `/v1` 프리픽스를 사용한다 (`main.ts`의 `setGlobalPrefix('v1')`).

**프리픽스가 붙지 않는 예외 3가지.**

| 경로 | 이유 |
| ---- | ---- |
| `GET /auth/kakao/callback` | 카카오 개발자 콘솔에 등록된 Redirect URI와 일치해야 한다. 프리픽스를 붙이면 콘솔을 수동 수정해야 하고 누락 시 소셜 로그인이 전면 장애난다 |
| `GET /auth/naver/callback` | 위와 동일 (네이버 개발자 콘솔) |
| `GET /` | 헬스체크성 루트 핸들러 |

로그인 **개시** URL(`/v1/auth/kakao`, `/v1/auth/naver`)은 콘솔 등록 대상이 아니라 프리픽스가 붙는다.

정적 파일(`/uploads/{filename}`)은 `setGlobalPrefix`의 영향을 받지 않으며, 프런트가 `${VITE_API_URL}${photoUrl}`로 경로를 조립하는 것에 대응하기 위해 **`/uploads`와 `/v1/uploads` 양쪽에 등록**돼 있다.

> ⚠️ 프런트엔드의 `VITE_API_URL`은 반드시 `/v1`을 포함해야 한다. 배포 시 서버의 `.env`를 갱신하고 프런트를 재빌드하지 않으면 구 경로를 호출해 전면 404가 난다.

---

## Swagger

개발 환경에서 `GET /docs`로 대화형 API 문서를 제공한다 (`@nestjs/swagger`).

- **운영 환경(`NODE_ENV=production`)에서는 노출되지 않는다** — 관리자 API 목록과 DTO 스키마 전체가 공개되면 공격 표면이 넓어지기 때문.
- JWT는 우측 상단 `Authorize` 버튼에 `Bearer {token}` 형식으로 입력한다.
- 문서상의 경로에는 `/v1` 프리픽스가 반영되어 있다.

---

## 응답 형태

Service는 Entity를 직접 반환하지 않고 **Response DTO**를 반환한다 (`dto/{domain}.response.dto.ts`). Entity → DTO 변환은 각 DTO의 `static from()` 정적 팩토리 한 곳에서만 일어난다.

주의할 직렬화 특성 세 가지.

- **생성 응답도 모든 키를 유지하며, 요청에 없던 컬럼은 `null`로 나간다.** TypeORM `repo.create()`가 nullable 컬럼을 `null`로, `default`가 있는 컬럼을 기본값으로 채우기 때문에 `undefined`가 발생하지 않는다. `POST /v1/restaurants` 응답은 `phone`·`description`·`hoursWeekday`·`hoursWeekend`·`breakTime`을 `null`로 담은 키 15개, `POST /v1/inquiries` 응답은 `status: "pending"`·`answer: null`·`answeredAt: null`을 포함한 키 8개다.
- **키가 생략되는 곳은 서비스가 `select`로 명시 제외한 필드다.** 값이 `undefined`이면 `JSON.stringify`가 키를 빼기 때문이다. 예를 들어 `GET /v1/pins/restaurant/:restaurantId` 응답에는 `updatedAt` 키가 없고, `GET /v1/admin/pins` 응답에는 `userId`·`restaurantId`·`updatedAt` 키가 없다.
- **`latitude`/`longitude`는 엔드포인트마다 타입이 다르다.** 조회 응답은 MySQL `DECIMAL`을 TypeORM이 문자열로 주므로 `"37.3670000"`, 생성 응답은 요청 값이 그대로 나가므로 `37.367`이다. 프런트는 `Number()`로 감싸 사용한다.

---

## 인증

JWT Bearer 토큰을 Authorization 헤더에 포함.

```
Authorization: Bearer {token}
```

토큰은 로그인/회원가입/소셜 로그인 성공 시 발급. 만료: 30일.

---

## 상태 코드 원칙

| 상황 | 코드 |
| ---- | ---- |
| 조회 성공 | 200 OK |
| 생성 성공 | 201 Created |
| 삭제 성공 | 204 No Content |
| POST /v1/auth/login 성공 | 200 OK (명시적 지정) |
| 유효성 검사 실패 | 400 Bad Request |
| 인증 없음 / 토큰 무효 | 401 Unauthorized |
| 권한 없음 (타인 리소스) | 403 Forbidden |
| 리소스 없음 | 404 Not Found |
| 중복 (이미 존재) | 409 Conflict |
| 호출 횟수 초과 (rate limit) | 429 Too Many Requests |

---

## Auth

### GET /v1/auth/check-email

이메일 중복 확인. 회원가입 1단계(기본 정보 입력)에서 다음 단계로 넘어가기 전 호출. rate limit 20회/분.

**Query Parameters**

| 파라미터 | 타입   | 설명       |
| -------- | ------ | ---------- |
| email    | string | 확인할 이메일 |

**Response** `200 OK`
```json
{ "available": true }
```

---

### POST /v1/auth/register

회원가입 (일반 이메일). `address`, `age`, `gender`는 필수값 — 소셜 로그인과 달리 일반 가입은 추가 정보를 의무 입력한다. rate limit 5회/분.

**Request**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "홍길동",
  "nickname": "길동이",
  "address": "서울 노원구 공릉동",
  "age": 25,
  "gender": "male",
  "favoriteCategories": ["한식", "카페/디저트"]
}
```

**Response** `201 Created`
```json
{ "token": "eyJhbGciOi..." }
```

**Error** `409 Conflict` — 이미 사용 중인 이메일 (check-email 통과 후 race로 중복돼도 동일하게 409)

---

### POST /v1/auth/login

일반 로그인. rate limit 5회/분.

**Request**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** `200 OK`
```json
{ "token": "eyJhbGciOi..." }
```

---

### GET /v1/auth/kakao

카카오 OAuth2 시작. 브라우저를 카카오 로그인 페이지로 리다이렉트. (API 호출이 아닌 전체 페이지 이동)

---

### GET /auth/kakao/callback

카카오 OAuth2 콜백. 성공 시 프론트엔드로 리다이렉트.

```
redirect → {FRONTEND_URL}/auth/callback#token={jwt}
```

---

### GET /v1/auth/naver

네이버 OAuth2 시작.

---

### GET /auth/naver/callback

네이버 OAuth2 콜백. 성공 시 프론트엔드로 리다이렉트.

---

### POST /v1/auth/admin/login

관리자 로그인. 이메일+비밀번호만 지원(소셜 로그인 없음). `role`이 `admin`이 아닌 계정은 비밀번호가 맞아도 거부된다. 정지(`isBanned`)된 계정도 거부. rate limit 5회/분.

**Request**
```json
{ "email": "admin@example.com", "password": "password123" }
```

**Response** `200 OK`
```json
{ "token": "eyJhbGciOi..." }
```

**최초 관리자 지정:** 회원가입 후 DB에서 해당 유저의 `role`을 `admin`으로 수동 변경.

---

### GET /v1/auth/admin/me *(관리자 인증 필요)*

관리자 세션 확인. `role`이 `admin`이 아니면 403.

**Response** `200 OK`
```json
{ "id": 1, "nickname": "관리자", "email": "admin@example.com", "role": "admin" }
```

---

## Restaurants

### GET /v1/restaurants

전체 식당 목록 조회. 인증 불필요.

**Response** `200 OK`
```json
[
  {
    "id": 1,
    "name": "노원 공릉동 경양식",
    "latitude": "37.6250000",
    "longitude": "127.0780000",
    "address": "서울 노원구 공릉동",
    "photoUrl": "/uploads/1234567890-abc.jpg",
    "category": "양식",
    "phone": "02-123-4567",
    "description": "분위기 좋은 경양식 레스토랑",
    "hoursWeekday": "11:00 - 21:00",
    "hoursWeekend": "11:00 - 20:00",
    "breakTime": "15:00 - 17:00",
    "createdAt": "2026-07-04T00:00:00.000Z",
    "updatedAt": "2026-07-04T00:00:00.000Z"
  }
]
```

---

### GET /v1/restaurants/:id

식당 단건 조회 (메뉴 포함). 인증 불필요.

**Response** `200 OK`
```json
{
  "id": 1,
  "name": "노원 공릉동 경양식",
  "menus": [
    {
      "id": 1,
      "restaurantId": 1,
      "name": "돈가스",
      "price": 12000,
      "isPopular": true,
      "emoji": "🍖"
    }
  ],
  ...
}
```

메뉴 항목의 `restaurantId`는 프런트 `Menu` 타입에는 선언돼 있지 않지만 **응답에 실제로 존재하는 키**다. `RestaurantMenuResponse`에서 빼면 계약 위반이 된다.

---

### POST /v1/restaurants *(인증 필요)*

식당 등록.

**Request**
```json
{
  "name": "새 식당",
  "latitude": 37.625,
  "longitude": 127.078,
  "address": "서울 노원구",
  "photoUrl": "/uploads/abc.jpg",
  "category": "한식"
}
```

**Response** `201 Created` — 생성된 식당 객체

---

### PATCH /v1/restaurants/:id *(인증 필요)*

식당 수정. 등록자 본인만 가능. 소유자가 없는(`userId: null`) 시드 식당은 관리자만 가능.

**Request** — 수정할 필드만 포함 (Partial)
```json
{ "name": "수정된 이름" }
```

**Response** `200 OK` — 수정된 식당 객체

---

### DELETE /v1/restaurants/:id *(인증 필요)*

식당 삭제. 등록자 본인만 가능. 소유자가 없는(`userId: null`) 시드 식당은 관리자만 가능.

**Response** `204 No Content`

---

## Pins

### GET /v1/pins/me *(인증 필요)*

내 핀 목록. restaurant 관계 포함.

**Response** `200 OK`
```json
[
  {
    "id": 1,
    "userId": 1,
    "restaurantId": 1,
    "rating": 4,
    "memo": "분위기 좋고 맛있음",
    "createdAt": "2026-07-04T00:00:00.000Z",
    "restaurant": { "id": 1, "name": "...", ... }
  }
]
```

---

### GET /v1/pins/restaurant/:restaurantId *(인증 필요)*

특정 식당의 핀(리뷰) 목록. user 정보 포함.

**Response** `200 OK`
```json
[
  {
    "id": 1,
    "userId": 1,
    "restaurantId": 1,
    "rating": 4,
    "memo": "맛있어요",
    "createdAt": "2026-07-04T00:00:00.000Z",
    "user": {
      "id": 1,
      "nickname": "홍길동",
      "profileImage": null
    }
  }
]
```

---

### POST /v1/pins/:restaurantId *(인증 필요)*

핀 등록. (userId, restaurantId) 조합은 UNIQUE — 중복 시 409.

**Request**
```json
{
  "rating": 4,
  "memo": "맛있어요"
}
```

**Response** `201 Created` — 생성된 핀 객체

---

### PATCH /v1/pins/:restaurantId *(인증 필요)*

핀 수정. 본인 핀만 가능.

**Request** — 수정할 필드만 포함
```json
{ "rating": 5, "memo": "더 맛있어졌어요" }
```

**Response** `200 OK` — 수정된 핀 객체

---

### DELETE /v1/pins/:restaurantId *(인증 필요)*

핀 삭제.

**Response** `204 No Content`

---

## Notifications

### GET /v1/notifications *(인증 필요)*

알림 목록. 근처 새 맛집 + 내 핀 식당의 새 리뷰.

**Query Parameters**

| 파라미터 | 타입   | 설명                          |
| -------- | ------ | ----------------------------- |
| lat      | number | 현재 위도 (없으면 맛집 알림 제외) |
| lng      | number | 현재 경도                     |
| radius   | number | 반경 (km, 기본값: 5)          |

**Response** `200 OK`
```json
[
  {
    "type": "new_restaurant",
    "restaurantId": 1,
    "restaurantName": "노원 공릉동 경양식",
    "message": "근처에 새 맛집 '노원 공릉동 경양식'이(가) 등록되었어요",
    "createdAt": "2026-07-04T00:00:00.000Z"
  },
  {
    "type": "new_review",
    "restaurantId": 2,
    "restaurantName": "순댓국밥",
    "message": "홍길동님이 '순댓국밥'에 리뷰를 남겼어요",
    "createdAt": "2026-07-03T00:00:00.000Z"
  }
]
```

**알림 타입**

| type | 설명 | 조건 |
| ---- | ---- | ---- |
| `new_restaurant` | 근처 새 맛집 등록 | lat/lng 필요, 최근 3일 이내, 기본 반경 5km |
| `new_review` | 내 핀 식당에 타인 리뷰 | 내가 핀한 식당에 다른 유저가 핀 등록 |

---

## Upload

### POST /v1/upload/image *(인증 필요)*

이미지 업로드. `multipart/form-data`.

**Request**
```
Content-Type: multipart/form-data
field: file (이미지 파일, 최대 10MB)
```

**Response** `201 Created`
```json
{ "url": "/uploads/1234567890-abc.jpg" }
```

**정적 파일 접근:** `GET /uploads/{filename}` — 인증 불필요

---

## Users

### GET /v1/users/me *(인증 필요)*

내 프로필 조회. password 등 민감 정보 제외.

**Response** `200 OK`
```json
{
  "id": 1,
  "provider": null,
  "email": "user@example.com",
  "name": "홍길동",
  "nickname": "길동이",
  "profileImage": "/uploads/1234567890-abc.jpg",
  "address": "서울 노원구",
  "age": 25,
  "gender": "male",
  "createdAt": "2026-07-01T00:00:00.000Z",
  "favoriteCategories": ["한식", "카페/디저트"]
}
```

---

### PATCH /v1/users/me *(인증 필요)*

프로필 수정. 수정할 필드만 포함. `favoriteCategories`를 보내면 기존 즐겨찾는 카테고리를 전부 교체한다 (빈 배열이면 전체 삭제). `profileImage`에 `null`을 보내면 기본 프로필로 되돌린다.

**Request**
```json
{
  "name": "홍길동",
  "nickname": "새닉네임",
  "profileImage": "/uploads/abc.jpg",
  "address": "서울 강남구",
  "age": 30,
  "gender": "male",
  "favoriteCategories": ["한식", "카페/디저트"]
}
```

**Response** `200 OK` — 수정된 프로필 (GET /v1/users/me와 동일 형식, favoriteCategories 포함)

---

## Inquiries

### GET /v1/inquiries *(인증 필요)*

내 문의 목록.

**Response** `200 OK`
```json
[
  {
    "id": 1,
    "userId": 1,
    "title": "지도가 안 열려요",
    "content": "안드로이드에서 지도 탭을 누르면...",
    "status": "pending",
    "answer": null,
    "answeredAt": null,
    "createdAt": "2026-07-10T00:00:00.000Z"
  }
]
```

---

### POST /v1/inquiries *(인증 필요)*

문의 등록.

**Request**
```json
{
  "title": "지도가 안 열려요",
  "content": "안드로이드에서 지도 탭을 누르면 화면이 하얗게 나와요."
}
```

**Response** `201 Created` — 생성된 문의 객체 (`status: "pending"`)

**답변:** `PATCH /v1/admin/inquiries/:id/answer`(관리자 전용)으로 등록한다.

---

## Admin

모든 엔드포인트 `JwtAuthGuard` + `AdminGuard` 적용 — `role`이 `admin`이 아니면 403.

### GET /v1/admin/stats

요약 통계.

**Response** `200 OK`
```json
{ "userCount": 42, "restaurantCount": 172, "pendingInquiryCount": 3 }
```

---

### GET /v1/admin/users

회원 목록. `search` 쿼리로 닉네임/이메일 부분 검색.

**Response** `200 OK`
```json
[
  {
    "id": 1,
    "provider": null,
    "email": "user@example.com",
    "nickname": "길동이",
    "role": "user",
    "isBanned": false,
    "createdAt": "2026-07-01T00:00:00.000Z"
  }
]
```

---

### PATCH /v1/admin/users/:id/ban

회원 정지/해제.

**Request** `{ "banned": true }`

**Response** `200 OK`

**즉시 반영:** 정지된 유저는 다음 요청부터 (본인이 이미 로그인해있어도) `JwtStrategy`에서 즉시 401로 거부된다.

---

### DELETE /v1/admin/users/:id

회원 삭제. 연관된 핀·즐겨찾기·문의가 CASCADE로 함께 삭제된다.

**Response** `204 No Content`

---

### GET /v1/admin/restaurants

식당 목록. `search` 쿼리로 이름 부분 검색.

---

### DELETE /v1/admin/restaurants/:id

식당 삭제 (등록자 소유권 무관, 관리자는 전체 삭제 가능). 관련 핀·메뉴가 CASCADE로 함께 삭제된다.

**Response** `204 No Content`

---

### GET /v1/admin/pins

전체 리뷰(핀) 목록. 작성자 닉네임 + 식당 이름 포함.

---

### DELETE /v1/admin/pins/:id

부적절한 리뷰 삭제.

**Response** `204 No Content`

---

### GET /v1/admin/inquiries

전체 유저의 문의 목록 (작성자 닉네임/이메일 포함).

---

### PATCH /v1/admin/inquiries/:id/answer

문의 답변 등록. `status`를 `answered`로, `answeredAt`을 현재 시각으로 자동 설정.

**Request** `{ "answer": "안드로이드 앱 캐시를 지우고 다시 시도해주세요." }`

**Response** `200 OK` — 수정된 문의 객체

---

## 갱신 트리거

이 파일을 갱신해야 하는 경우.
- 새 엔드포인트 추가 시
- 요청/응답 형식 변경 시
- 인증 방식 변경 시
- 상태 코드 정책 변경 시
