# FoodPin — CLAUDE.md

가본 식당을 지도에 핀으로 찍고 별점·메모를 남기는 맛집 지도 앱. 백엔드 포트폴리오 프로젝트.

---

## 협업 규칙

- 커밋·푸시는 사용자가 직접 수행한다. Claude Code는 코드만 작성한다.
- 코드에 Claude 관련 정보(Co-Authored-By 등)를 절대 넣지 않는다.
- UI는 **모바일 퍼스트** 기준으로 작성한다 (375px 기준 → 태블릿/데스크탑 확장).
- TypeScript strict 모드를 사용한다.
- API 응답은 항상 JSON.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | React (Vite + TypeScript), 포트 5173 |
| 백엔드 | NestJS (TypeScript), 포트 3000 |
| DB | MySQL + TypeORM |
| 지도 | Leaflet + OpenStreetMap (카카오맵 심사 후 교체 예정) |
| 모바일 | Capacitor (iOS/Android) |
| 인증 | 네이버/카카오 OAuth2 + JWT |
| 배포 | AWS Lightsail (Ubuntu) |

---

## 개발 순서 및 현황

| 단계 | 내용 | 상태 |
|------|------|------|
| 1 | 모노레포 세팅 (NestJS + Vite React TS) | ✅ 완료 |
| 2 | 지도 연동 (Leaflet + OpenStreetMap) | ✅ 완료 |
| 3 | 백엔드 CRUD API (restaurant) | ✅ 완료 |
| 4 | 지도 클릭 → 핀 추가 폼 | ✅ 완료 |
| 5 | 핀 목록 UI + 삭제/수정 | 🔲 |
| 6 | 네이버/카카오 OAuth2 + JWT | 🔲 |
| 7 | Capacitor 세팅 (iOS/Android) | 🔲 |
| 8 | 모바일 반응형 UI | 🔲 |
| 9 | AWS Lightsail 배포 | 🔲 |

---

## 모노레포 구조

> 폴더 구조는 기능 추가에 따라 변경될 수 있다.

```
FoodPin/
├── CLAUDE.md
├── package.json              ← npm workspaces 루트
├── backend/                  ← NestJS
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── restaurants/
│   │   │   ├── restaurants.module.ts
│   │   │   ├── restaurants.controller.ts
│   │   │   ├── restaurants.service.ts
│   │   │   ├── restaurant.entity.ts
│   │   │   └── dto/
│   │   └── auth/             ← OAuth2 + JWT (예정)
│   └── .env
└── frontend/                 ← React (Vite + TS)
    ├── src/
    │   ├── App.tsx
    │   ├── components/
    │   └── api/
    └── .env
```

---

## API 설계

| Method | URL | 설명 |
|--------|-----|------|
| GET | /restaurants | 전체 식당 목록 조회 |
| GET | /restaurants/:id | 식당 단건 조회 |
| POST | /restaurants | 식당 등록 |
| PATCH | /restaurants/:id | 식당 수정 |
| DELETE | /restaurants/:id | 식당 삭제 |
| GET | /auth/kakao | 카카오 OAuth2 시작 |
| GET | /auth/kakao/callback | 카카오 OAuth2 콜백 |
| GET | /auth/naver | 네이버 OAuth2 시작 |
| GET | /auth/naver/callback | 네이버 OAuth2 콜백 |

---

## DB 스키마

> 스키마는 개발 중 변경될 수 있다. TypeORM `synchronize: true` (개발 환경)로 자동 반영.

**restaurant 테이블**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT (PK, AI) | 고유 ID |
| name | VARCHAR(100) | 식당 이름 |
| latitude | DECIMAL(10,7) | 위도 |
| longitude | DECIMAL(10,7) | 경도 |
| rating | TINYINT | 별점 (1~5) |
| memo | TEXT | 메모 |
| address | VARCHAR(255) | 주소 |
| created_at | DATETIME | 등록일 |
| updated_at | DATETIME | 수정일 |

**user 테이블 (예정)**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT (PK, AI) | 고유 ID |
| provider | VARCHAR(20) | kakao / naver |
| provider_id | VARCHAR(100) | 소셜 고유 ID |
| nickname | VARCHAR(50) | 닉네임 |
| created_at | DATETIME | 가입일 |

---

## 환경변수

### backend/.env

```
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_DATABASE=foodpin
JWT_SECRET=
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
KAKAO_CALLBACK_URL=http://localhost:3000/auth/kakao/callback
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
NAVER_CALLBACK_URL=http://localhost:3000/auth/naver/callback
```

### frontend/.env

```
VITE_API_URL=http://localhost:3000
VITE_KAKAO_MAP_KEY=3c968d8908eb81ac45ef8a39e7e3889f
```

---

## CORS

- 개발: `http://localhost:5173` 허용
- 운영: 배포 도메인으로 교체

---

## Spring Boot → NestJS 대응표

| Spring Boot | NestJS |
|-------------|--------|
| `@RestController` | `@Controller` |
| `@Service` | `@Injectable` |
| `@Repository` | TypeORM Repository |
| `@Autowired` / 생성자 DI | `constructor(private svc: Svc)` |
| `@GetMapping` | `@Get` |
| `@PostMapping` | `@Post` |
| `@RequestBody` | `@Body` |
| `@PathVariable` | `@Param` |
| `application.yml` | `.env` + `ConfigModule` |
| JPA Entity | TypeORM Entity |
| `ddl-auto: update` | `synchronize: true` (개발만) |
| Spring Security + OAuth2 | Passport.js + @nestjs/passport |
| JWT (jjwt) | @nestjs/jwt |

---

## 카카오 지도 API

- 발급: https://developers.kakao.com
- 키 종류: JavaScript 키
- 플랫폼 등록: `http://localhost:5173` (개발) / 배포 도메인 (운영)
- 키 입력 위치: `frontend/.env` → `VITE_KAKAO_MAP_KEY`
- 현재 상태: 비즈 앱 심사 신청 완료 → 승인 후 Leaflet 교체 예정
