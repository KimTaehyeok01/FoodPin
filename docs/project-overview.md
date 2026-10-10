# Project Overview

가본 식당을 지도에 핀으로 찍고 별점·메모를 남기는 맛집 지도 앱.
백엔드 포트폴리오 프로젝트로, Spring Boot 경험자가 NestJS를 학습하며 구축 중이다.

---

## 핵심 기능

1. **카카오맵 연동** — 지도에서 위치 클릭 → 식당 등록 → 핀 표시
2. **식당 CRUD** — 이름·위치·카테고리·사진·메뉴·영업시간 관리
3. **핀(별점·메모)** — 유저별 식당에 별점(1~5)과 메모 저장, 한 유저당 식당마다 1개
4. **소셜 로그인** — 카카오·네이버 OAuth2 + 일반 이메일 로그인
5. **알림** — 근처 새 맛집 등록, 내가 핀한 식당의 새 리뷰 알림
6. **이미지 업로드** — 식당 사진 업로드 (multer, 로컬 저장)

---

## 개발 현황

| 단계 | 내용                                   | 상태    |
| ---- | -------------------------------------- | ------- |
| 1    | 모노레포 세팅 (NestJS + Vite React TS) | ✅ 완료 |
| 2    | 지도 연동 (카카오맵)                   | ✅ 완료 |
| 3    | 백엔드 CRUD API (restaurant)           | ✅ 완료 |
| 4    | 지도 클릭 → 핀 추가 폼                 | ✅ 완료 |
| 5    | 핀 CRUD (등록/수정/삭제) + 내 핀 조회  | ✅ 완료 |
| 6    | 네이버/카카오 OAuth2 + 일반 로그인·JWT | ✅ 완료 |
| 7    | 식당 상세 페이지 (메뉴·리뷰·부가정보)  | ✅ 완료 |
| 8    | 이미지 업로드 (multer)                 | ✅ 완료 |
| 9    | 알림 기능 (근처 맛집·새 리뷰)          | ✅ 완료 |
| 10   | Capacitor 세팅 (iOS/Android)           | 🔲      |
| 11   | 모바일 반응형 UI 마감                  | 🔲      |
| 12   | AWS Lightsail 배포                     | 🔲      |

---

## 모노레포 구조

```
FoodPin/
├── CLAUDE.md                     ← AI 작업 허브 문서
├── docs/                         ← 기술 문서
│   ├── project-overview.md
│   ├── architecture.md
│   ├── erd.md
│   ├── api.md
│   ├── coding-style.md
│   └── security.md
├── features/                     ← 도메인별 기능 문서
│   ├── auth.md
│   ├── restaurants.md
│   ├── pins.md
│   ├── notifications.md
│   └── upload.md
├── db.sql                        ← DB 스키마 + 시드 데이터
├── package.json                  ← npm workspaces 루트
├── backend/                      ← NestJS
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── auth/
│   │   ├── restaurants/
│   │   ├── pins/
│   │   ├── users/
│   │   ├── notifications/
│   │   └── upload/
│   └── .env
└── frontend/                     ← React (Vite + TS)
    ├── src/
    │   ├── App.tsx               ← 라우터 + 오버레이 구조
    │   ├── pages/
    │   │   ├── HomePage.tsx
    │   │   ├── MapPage.tsx
    │   │   ├── NotificationsPage.tsx
    │   │   ├── NotificationSettingsPage.tsx
    │   │   ├── auth/             ← OnboardingPage, LoginPage, RegisterPage, AuthCallback
    │   │   ├── my/               ← MyPage, FavoritesPage, ProfileEditPage
    │   │   └── restaurant/       ← RestaurantDetailPage, RestaurantListPage
    │   ├── components/
    │   │   ├── KakaoMap.tsx
    │   │   ├── RestaurantCard.tsx
    │   │   ├── BottomNav.tsx
    │   │   ├── AddPinForm.tsx
    │   │   └── PinForm.tsx
    │   ├── api/
    │   │   └── restaurants.ts    ← 모든 API 호출 집중
    │   ├── types/
    │   │   └── kakao.d.ts
    │   └── utils/
    │       ├── distance.ts
    │       └── notiSettings.ts
    └── .env
```

---

## 환경변수

### backend/.env

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_DATABASE=foodpin
JWT_SECRET=
FRONTEND_URL=http://localhost:5173
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
KAKAO_CALLBACK_URL=http://localhost:3000/auth/kakao/callback
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
NAVER_CALLBACK_URL=http://localhost:3000/auth/naver/callback
```

`KAKAO_CALLBACK_URL`·`NAVER_CALLBACK_URL`은 **`/v1` 없이** 유지한다. 두 값은 카카오·네이버 개발자 콘솔에 등록된 Redirect URI와 정확히 일치해야 하며, `main.ts`의 `setGlobalPrefix` `exclude`가 이 경로를 프리픽스에서 제외한다.

### frontend/.env

```env
VITE_API_URL=http://localhost:3000/v1
VITE_KAKAO_MAP_KEY=<카카오 JavaScript 키>
```

> ⚠️ `VITE_API_URL`은 **반드시 `/v1`을 포함**한다. 백엔드 전 엔드포인트가 `/v1` 프리픽스를 쓰기 때문이다. 배포 시 서버의 `.env`를 갱신하고 프런트를 **재빌드**하지 않으면 구 경로를 호출해 전면 404가 난다.

---

## 실행 방법

```bash
# 루트에서 동시 실행
npm run dev:backend   # NestJS → http://localhost:3000
npm run dev:frontend  # Vite   → http://localhost:5173
```

API 문서는 개발 환경에서 `http://localhost:3000/docs` (Swagger UI). 운영(`NODE_ENV=production`)에서는 노출되지 않는다.

### 백엔드 검증 명령

```bash
cd backend
npm run build      # nest build (타입 체크 포함)
npm test           # jest — Service 단위 + 응답 계약 테스트
npm run lint       # eslint (검사만, 파일 수정 안 함)
npm run lint:fix   # eslint --fix (포매팅 자동 수정)
```

> `lint`와 `lint:fix`는 분리돼 있다. 예전에는 `lint`에 `--fix`가 붙어 있어 **검사만 하려 해도 Entity를 포함한 소스가 자동 재포매팅**됐다. `synchronize: true` 환경에서 Entity 변경은 스키마 재생성 위험이 있어 분리했다.

---

## 카카오 지도 API

- 발급: https://developers.kakao.com
- 키 종류: JavaScript 키
- 플랫폼 등록: `http://localhost:5173` (개발) / 배포 도메인 (운영)
- SDK 로드: `dapi.kakao.com/v2/maps/sdk.js?libraries=services` (장소 검색 포함)
- 현재: 비즈 앱 승인 완료, 개발 중 테스트 앱 키 사용

---

## 갱신 트리거

이 파일을 갱신해야 하는 경우.
- 개발 현황 단계 완료 시
- 새 폴더/파일 구조 추가 시
- 환경변수 추가/변경 시
- 배포 환경 변경 시
