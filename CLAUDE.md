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
| 지도 | 카카오 지도 JavaScript API |
| 배포 | AWS Lightsail (Ubuntu) |

---

## 모노레포 구조

> 폴더 구조는 기능 추가에 따라 변경될 수 있다.

```
FoodPin/
├── CLAUDE.md
├── package.json          ← npm workspaces 루트
├── backend/              ← NestJS
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   └── restaurants/
│   │       ├── restaurants.module.ts
│   │       ├── restaurants.controller.ts
│   │       ├── restaurants.service.ts
│   │       ├── restaurant.entity.ts
│   │       └── dto/
│   └── .env
└── frontend/             ← React (Vite + TS)
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
```

### frontend/.env

```
VITE_API_URL=http://localhost:3000
VITE_KAKAO_MAP_KEY=발급후입력
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

---

## 카카오 지도 API

- 발급: https://developers.kakao.com
- 키 종류: JavaScript 키
- 플랫폼 등록: `http://localhost:5173` (개발) / 배포 도메인 (운영)
- 키 입력 위치: `frontend/.env` → `VITE_KAKAO_MAP_KEY`
