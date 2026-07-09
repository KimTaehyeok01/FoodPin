# FoodPin

가본 식당을 지도에 핀으로 기록하고 별점·메모를 남기는 맛집 지도 앱입니다.

## 프로젝트 개요

- **목표**. 지도 기반 개인 맛집 아카이빙과 간단한 리뷰 공유.
- **구성**. React 19(Vite) 프론트엔드 + NestJS 백엔드 + MySQL.
- **인증**. 일반 로그인 + 카카오/네이버 OAuth2 + JWT(30일).
- **문서 중심 개발**. `docs/`와 `features/`에 구조·API·보안 규칙을 정리해 관리.

## 주요 기능

1. 카카오맵 기반 식당 탐색과 핀 표시.
2. 식당 CRUD(이름, 위치, 카테고리, 사진, 메뉴, 영업정보).
3. 유저별 핀 CRUD(별점 1~5, 메모, 식당당 1개).
4. 근처 신규 식당과 내 핀 식당 신규 리뷰 알림.
5. 이미지 업로드와 정적 파일 서빙.
6. 마이페이지 기반 프로필 조회·수정.

## 기술 스택

| 영역 | 기술 |
| --- | --- |
| Frontend | React 19, Vite, TypeScript, React Router |
| Backend | NestJS, TypeScript, TypeORM, Passport |
| Database | MySQL |
| Auth | JWT, OAuth2(카카오/네이버), bcrypt |
| Upload | Multer(이미지 업로드), `/uploads` 정적 서빙 |
| Infra | AWS Lightsail(배포 대상) |

## 아키텍처 요약

```text
Browser (React + Vite, :5173)
        ↓ HTTP(fetch, JWT 인증 헤더)
NestJS API (:3000)
  Controller → Service → TypeORM Repository
        ↓
      MySQL
```

- 백엔드는 도메인 모듈(`auth`, `restaurants`, `pins`, `users`, `notifications`, `upload`)로 구성됩니다.
- 프론트는 탭 페이지 keep-alive + 세부 페이지 오버레이 라우팅 패턴을 사용합니다.

## 모노레포 구조

```text
FoodPin/
├── backend/        # NestJS API 서버
├── frontend/       # React(Vite) 웹 앱
├── docs/           # 아키텍처, API, ERD, 보안 문서
├── features/       # 도메인별 기능 명세 문서
├── db.sql          # 스키마/시드
└── CLAUDE.md       # 협업 규칙 및 개발 가이드
```

## 시작하기

### 1) 요구 사항

- Node.js 20+
- npm 10+
- MySQL 8+

### 2) 의존성 설치

```bash
npm install
```

### 3) 환경변수 설정

`backend/.env`

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_DATABASE=foodpin
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173

KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
KAKAO_CALLBACK_URL=http://localhost:3000/auth/kakao/callback

NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
NAVER_CALLBACK_URL=http://localhost:3000/auth/naver/callback
```

`frontend/.env`

```env
VITE_API_URL=http://localhost:3000
VITE_KAKAO_MAP_KEY=your_kakao_js_key
```

### 4) 개발 서버 실행

루트에서 각각 실행합니다.

```bash
npm run dev:backend   # http://localhost:3000
npm run dev:frontend  # http://localhost:5173
```

## 빌드

```bash
npm run build:backend
npm run build:frontend
```

## API 요약

- Base URL. `http://localhost:3000`
- 인증 방식. JWT 기반 Authorization 헤더 사용.
- 대표 엔드포인트
  - `POST /auth/register`, `POST /auth/login`
  - `GET/POST/PATCH/DELETE /restaurants`
  - `GET/POST/PATCH/DELETE /pins`
  - `GET /notifications`
  - `POST /upload/image`
  - `GET/PATCH /users/me`

자세한 요청/응답 형식은 `docs/api.md`를 참고하세요.

## 참고 문서

- 프로젝트 개요. `docs/project-overview.md`
- 시스템 구조. `docs/architecture.md`
- API 명세. `docs/api.md`
- ERD. `docs/erd.md`
- 보안 정책. `docs/security.md`
- 코딩 스타일. `docs/coding-style.md`
