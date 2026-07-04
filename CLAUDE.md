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

| 영역       | 기술                                                 |
| ---------- | ---------------------------------------------------- |
| 프론트엔드 | React (Vite + TypeScript), 포트 5173                 |
| 백엔드     | NestJS (TypeScript), 포트 3000                       |
| DB         | MySQL + TypeORM                                      |
| 지도       | 카카오맵 (Kakao Maps JavaScript SDK)                 |
| 모바일     | Capacitor (iOS/Android)                              |
| 인증       | 네이버/카카오 OAuth2 + JWT                           |
| 배포       | AWS Lightsail (Ubuntu)                               |

---

## 개발 순서 및 현황

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
| 9    | Capacitor 세팅 (iOS/Android)           | 🔲      |
| 10   | 모바일 반응형 UI 마감                  | 🔲      |
| 11   | AWS Lightsail 배포                     | 🔲      |

---

## 모노레포 구조

> 폴더 구조는 기능 추가에 따라 변경될 수 있다.

```
FoodPin/
├── CLAUDE.md
├── db.sql                    ← DB 스키마 + 시드 데이터
├── package.json              ← npm workspaces 루트
├── backend/                  ← NestJS
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── restaurants/      ← 식당 CRUD + 메뉴
│   │   │   ├── restaurant.entity.ts
│   │   │   ├── restaurant-menu.entity.ts
│   │   │   └── dto/
│   │   ├── pins/             ← 핀(별점·메모) CRUD
│   │   │   └── pin.entity.ts
│   │   ├── users/            ← 유저 + 즐겨찾는 카테고리
│   │   │   ├── user.entity.ts
│   │   │   └── user-favorite-category.entity.ts
│   │   ├── auth/             ← OAuth2 + 일반 로그인 + JWT
│   │   └── upload/           ← 이미지 업로드 (multer)
│   └── .env
└── frontend/                 ← React (Vite + TS)
    ├── src/
    │   ├── App.tsx
    │   ├── pages/            ← Home / Map / My / 상세 / 로그인 등
    │   ├── components/
    │   ├── api/
    │   └── types/           ← kakao.d.ts (카카오맵 타입 선언)
    └── .env
```

---

## API 설계

| Method | URL                        | 설명                        | 인증 |
| ------ | -------------------------- | --------------------------- | ---- |
| GET    | /restaurants               | 전체 식당 목록 조회         |      |
| GET    | /restaurants/:id           | 식당 단건 조회 (메뉴 포함)  |      |
| POST   | /restaurants               | 식당 등록                   | JWT  |
| PATCH  | /restaurants/:id           | 식당 수정                   | JWT  |
| DELETE | /restaurants/:id           | 식당 삭제                   | JWT  |
| GET    | /pins/me                   | 내 핀 목록 조회             | JWT  |
| GET    | /pins/restaurant/:id       | 특정 식당의 핀(리뷰) 목록   | JWT  |
| POST   | /pins/:restaurantId        | 핀 등록 (별점·메모)         | JWT  |
| PATCH  | /pins/:restaurantId        | 핀 수정                     | JWT  |
| DELETE | /pins/:restaurantId        | 핀 삭제                     | JWT  |
| POST   | /upload/image              | 이미지 업로드               | JWT  |
| POST   | /auth/register             | 일반 회원가입               |      |
| POST   | /auth/login                | 일반 로그인                 |      |
| GET    | /auth/kakao                | 카카오 OAuth2 시작          |      |
| GET    | /auth/kakao/callback       | 카카오 OAuth2 콜백          |      |
| GET    | /auth/naver                | 네이버 OAuth2 시작          |      |
| GET    | /auth/naver/callback       | 네이버 OAuth2 콜백          |      |

---

## DB 스키마

> 스키마는 개발 중 변경될 수 있다. TypeORM `synchronize: true` (개발 환경)로 자동 반영.
> 전체 스키마와 시드 데이터는 루트 `db.sql` 참고. 정규화는 3NF 기준.

**restaurant 테이블** — 식당 정보

| 컬럼         | 타입          | 설명                    |
| ------------ | ------------- | ----------------------- |
| id           | INT (PK, AI)  | 고유 ID                 |
| userId       | INT (nullable)| 등록한 유저 (시드는 NULL) |
| name         | VARCHAR(100)  | 식당 이름               |
| latitude     | DECIMAL(10,7) | 위도                    |
| longitude    | DECIMAL(10,7) | 경도                    |
| address      | VARCHAR(255)  | 주소                    |
| photoUrl     | VARCHAR(500)  | 사진 URL                |
| category     | VARCHAR(50)   | 카테고리                |
| phone        | VARCHAR(20)   | 전화번호                |
| description  | TEXT          | 소개글                  |
| hoursWeekday | VARCHAR(50)   | 평일 영업시간           |
| hoursWeekend | VARCHAR(50)   | 주말 영업시간           |
| breakTime    | VARCHAR(50)   | 브레이크타임            |
| createdAt    | DATETIME      | 등록일                  |
| updatedAt    | DATETIME      | 수정일                  |

**restaurant_menu 테이블** — 식당 메뉴 (restaurant 1:N)

| 컬럼         | 타입         | 설명            |
| ------------ | ------------ | --------------- |
| id           | INT (PK, AI) | 고유 ID         |
| restaurantId | INT (FK)     | 식당 ID (CASCADE) |
| name         | VARCHAR(100) | 메뉴명          |
| price        | INT          | 가격            |
| isPopular    | BOOLEAN      | 인기 메뉴 여부  |
| emoji        | VARCHAR(8)   | 이모지          |

**pin 테이블** — 유저가 식당에 남긴 별점·메모 (user·restaurant 1:N, `(userId, restaurantId)` UNIQUE)

| 컬럼         | 타입         | 설명            |
| ------------ | ------------ | --------------- |
| id           | INT (PK, AI) | 고유 ID         |
| userId       | INT (FK)     | 유저 ID (CASCADE) |
| restaurantId | INT (FK)     | 식당 ID (CASCADE) |
| rating       | TINYINT      | 별점 (1~5, 기본 3) |
| memo         | TEXT         | 메모            |
| createdAt    | DATETIME     | 등록일          |
| updatedAt    | DATETIME     | 수정일          |

**user 테이블** — 유저 (일반 + 소셜)

| 컬럼         | 타입         | 설명                  |
| ------------ | ------------ | --------------------- |
| id           | INT (PK, AI) | 고유 ID               |
| provider     | VARCHAR(20)  | kakao / naver (소셜)  |
| providerId   | VARCHAR(100) | 소셜 고유 ID          |
| email        | VARCHAR(255) | 이메일 (일반, UNIQUE) |
| password     | VARCHAR(255) | 해시 비밀번호 (일반)  |
| nickname     | VARCHAR(50)  | 닉네임                |
| profileImage | VARCHAR(255) | 프로필 이미지         |
| address      | VARCHAR(255) | 주소                  |
| age          | TINYINT      | 나이                  |
| createdAt    | DATETIME     | 가입일                |

**user_favorite_category 테이블** — 즐겨찾는 카테고리 (user 1:N, 3NF 분리)

| 컬럼     | 타입         | 설명            |
| -------- | ------------ | --------------- |
| id       | INT (PK, AI) | 고유 ID         |
| userId   | INT (FK)     | 유저 ID (CASCADE) |
| category | VARCHAR(50)  | 카테고리        |

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
FRONTEND_URL=http://localhost:5173
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
VITE_KAKAO_MAP_KEY=<카카오 JavaScript 키>
```

---

## CORS

- 개발: `http://localhost:5173` 허용
- 운영: 배포 도메인으로 교체

---

## Spring Boot → NestJS 대응표

| Spring Boot              | NestJS                          |
| ------------------------ | ------------------------------- |
| `@RestController`        | `@Controller`                   |
| `@Service`               | `@Injectable`                   |
| `@Repository`            | TypeORM Repository              |
| `@Autowired` / 생성자 DI | `constructor(private svc: Svc)` |
| `@GetMapping`            | `@Get`                          |
| `@PostMapping`           | `@Post`                         |
| `@RequestBody`           | `@Body`                         |
| `@PathVariable`          | `@Param`                        |
| `application.yml`        | `.env` + `ConfigModule`         |
| JPA Entity               | TypeORM Entity                  |
| `ddl-auto: update`       | `synchronize: true` (개발만)    |
| Spring Security + OAuth2 | Passport.js + @nestjs/passport  |
| JWT (jjwt)               | @nestjs/jwt                     |

---

## 카카오 지도 API

- 발급: https://developers.kakao.com
- 키 종류: JavaScript 키
- 플랫폼 등록: `http://localhost:5173` (개발) / 배포 도메인 (운영)
- 키 입력 위치: `frontend/.env` → `VITE_KAKAO_MAP_KEY`
- 현재 상태: 비즈 앱 승인 완료 → 카카오맵 SDK 연동 완료 (개발 중 테스트 앱 키 사용)
- SDK 로드: `dapi.kakao.com/v2/maps/sdk.js` + `libraries=services` (장소 검색용)

## Behavioral Guidelines

Behavioral guidelines to reduce common LLM coding mistakes.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

### 5. No Closing Colons (Korean Output)

**End Korean sentences with a period, not a colon.**

When the user writes in Korean, output is also Korean:

- Don't end sentences with `:` even if the next line is a list or example.
- The test: every Korean sentence terminator should be `.`, `?`, or `!` — not `:`.
- Colons are fine inside code, key-value pairs, or labels. Not as sentence enders.

### 6. File Header Comments in Korean

**First line of every new source file: a one-line Korean comment stating its role.**

When creating a new file:

- TypeScript/JavaScript: `// 사용자 인증 상태를 관리하는 Context Provider`
- Python: `# KIS API 호출을 비동기로 래핑하는 클라이언트`
- SQL: `-- 일별 집계 결과를 저장하는 머티리얼라이즈드 뷰`
- Place it directly under required directives (`'use client'`, `'use server'`, shebang).
- Skip config files (`*.config.ts`, `package.json`, etc.).

### 7. Plan + Checklist + Context Notes

**Before any non-trivial task, produce three artifacts. Don't start coding without them.**

- **Plan** — what we're building and why.
- **Checklist** (`checklist.md`) — concrete tasks as checkboxes. Tick as you go.
- **Context Notes** (`context-notes.md`) — decisions made during the work and the reasoning behind them. Append continuously.

### 8. Run Tests Before Marking Complete

**If you touched code, run the tests before saying "done".**

- `npm test`, `pytest`, `cargo test`, whatever the project uses — run it.
- If tests pass, report results. If they fail, fix and re-run.
- No test setup? At minimum, verify the project builds/compiles.
- Run tests proactively — not after the user signals completion.

### 9. Semantic Commits

**Note: The user commits manually. Never run `git commit`.**

- The test: "Can I describe this change in one sentence?" If yes, it's one logical unit. If no, the changes are still mixed.
- Don't accumulate unrelated edits — keep changes focused for easy rollback.

### 10. Read Errors, Don't Guess

**Read the actual error/log line. Don't pattern-match from memory.**

When something fails:

- Read the full error message and stack trace.
- Check the actual log output, not what you assume it should say.
- Don't apply a "common fix" before confirming the cause.
- If unclear, add a print/log to verify state — then fix.
