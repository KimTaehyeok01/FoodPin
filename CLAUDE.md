# FoodPin — CLAUDE.md

가본 식당을 지도에 핀으로 찍고 별점·메모를 남기는 맛집 지도 앱. 백엔드 포트폴리오 프로젝트.

---

## 협업 규칙

- 커밋·푸시는 사용자가 직접 수행한다. Claude Code는 코드만 작성한다.
- 코드에 Claude 관련 정보(Co-Authored-By 등)를 절대 넣지 않는다.
- UI는 **모바일 퍼스트** 기준으로 작성한다 (375px 기준 → 태블릿/데스크탑 확장).
- **UI 수정 시 반드시 모바일(375px) · 태블릿(600px) · PC(960px) 세 화면을 모두 함께 수정한다.**
- TypeScript strict 모드를 사용한다.
- API 응답은 항상 JSON.
- 새 소스 파일 첫 줄에 한국어 주석으로 역할을 명시한다.

---

## 기술 스택

| 영역       | 기술                                                 |
| ---------- | ---------------------------------------------------- |
| 프론트엔드 | React 19 (Vite + TypeScript), 포트 5173              |
| 백엔드     | NestJS (TypeScript), 포트 3000                       |
| DB         | MySQL + TypeORM (`synchronize: true`, 개발 환경)     |
| 지도       | 카카오맵 JavaScript SDK                              |
| 인증       | 네이버/카카오 OAuth2 + JWT (30일 만료)               |
| 배포       | AWS Lightsail (Ubuntu)                               |

---

## 문서 지도

| 문서 | 내용 |
| ---- | ---- |
| [docs/project-overview.md](docs/project-overview.md) | 앱 설명, 개발 현황, 폴더 구조, 환경변수, 실행 방법 |
| [docs/architecture.md](docs/architecture.md) | 시스템 아키텍처, 백엔드 레이어, 프론트 라우팅, 인증 흐름 |
| [docs/erd.md](docs/erd.md) | 엔티티 상세, 관계 다이어그램, 컬럼 정의 |
| [docs/api.md](docs/api.md) | 전체 엔드포인트, 요청/응답 형식, 상태 코드 |
| [docs/coding-style.md](docs/coding-style.md) | 코딩 스타일, 네이밍 규칙, CSS 클래스 규칙 |
| [docs/security.md](docs/security.md) | JWT, OAuth, 비밀번호, 파일 업로드 보안 |
| [features/auth.md](features/auth.md) | 로그인·회원가입·소셜 로그인 구현 |
| [features/restaurants.md](features/restaurants.md) | 식당 CRUD, 메뉴, 지도 핀 |
| [features/pins.md](features/pins.md) | 핀(별점·메모) CRUD, 찜 목록 |
| [features/notifications.md](features/notifications.md) | 알림 조회, 설정, 읽음 처리 |
| [features/upload.md](features/upload.md) | 이미지 업로드, 정적 파일 서빙 |

---

## 작업 절차

기능 구현 요청을 받으면 다음 순서로 진행한다.

1. **파악** — 관련 feature 문서 + 현재 코드 확인
2. **계획** — 수정할 파일 목록과 변경 내용 간략히 제시
3. **구현** — 최소한의 변경, 기존 패턴 준수
4. **검증** — 빌드/컴파일 오류 없는지 확인
5. **문서 갱신 제안** — 변경 내용에 따라 갱신이 필요한 문서 목록 제시

---

## 핵심 코딩 규칙

> 세부 규칙은 [docs/coding-style.md](docs/coding-style.md) 참고.

### 백엔드

**네이밍**
- 파일: `kebab-case` (예: `create-pin.dto.ts`, `jwt-auth.guard.ts`)
- 클래스: `PascalCase` + 역할 접미사 (예: `PinsService`, `JwtAuthGuard`, `CreatePinDto`)
- 서비스 메서드: 동사+명사형 (예: `findAll`, `getMyPins`, `findOrCreate`)
- 상수: `UPPER_SNAKE_CASE` (예: `NEARBY_RADIUS_KM`, `NEARBY_DAYS`)
- Repository 주입 변수: `xxxRepo` 약칭 권장 (예: `restaurantRepo`, `pinRepo`)

**DTO 사용 규칙**
- 생성용: `Create{Domain}Dto` — `class-validator` 데코레이터로 유효성 검사
- 수정용: `Update{Domain}Dto extends PartialType(Create{Domain}Dto)` — 모든 필드 선택적
- DTO는 도메인별 `dto/` 서브디렉토리에 배치
- ValidationPipe(`whitelist: true, forbidNonWhitelisted: true, transform: true`)가 전역 적용

**예외 처리 규칙**
- 서비스 레이어에서 NestJS 내장 예외를 `throw`로 직접 사용
- 사용 클래스: `NotFoundException`, `ConflictException`, `UnauthorizedException`, `ForbiddenException`, `BadRequestException`
- 에러 메시지는 **한국어**로 작성 (예: `'식당을 찾을 수 없습니다.'`)
- 컨트롤러에 try/catch 금지 — 예외는 서비스에서만 던진다

**응답 포맷**
- 별도 Response 래퍼 클래스 없음 — 엔티티 또는 배열 직접 반환
- 예외: 로그인·회원가입 → `{ token: string }`, 업로드 → `{ url: string }`
- DELETE → `@HttpCode(HttpStatus.NO_CONTENT)` (204)
- POST /auth/login → `@HttpCode(HttpStatus.OK)` (200)

**Guard 적용 원칙**
- 모든 엔드포인트가 인증 필요 → 클래스 레벨 `@UseGuards(JwtAuthGuard)`
- 일부만 인증 필요 → 메서드 레벨 선택 적용

### 프론트엔드

**네이밍**
- 컴포넌트/페이지 파일: `PascalCase.tsx` (예: `RestaurantCard.tsx`, `HomePage.tsx`)
- 유틸/API 파일: `camelCase.ts` (예: `notiSettings.ts`, `restaurants.ts`)
- 이벤트 핸들러: `handle` 접두사 (예: `handleLogin`, `handleBack`, `handlePin`)
- CSS 클래스: 페이지별 prefix + BEM 변형 (예: `home-header__left`, `rc__pin-btn--active`)

**컴포넌트 규칙**
- 함수형 컴포넌트 + hooks 패턴만 사용
- Props 인터페이스는 컴포넌트 파일 내 인라인 정의 (`interface Props { ... }`)
- 전역 상태 관리 라이브러리 없음 (`useState` + `localStorage`)
- CSS는 동명 `.css` 파일에 분리 (`RestaurantCard.tsx` → `RestaurantCard.css`)

**API 호출 규칙**
- `api/restaurants.ts`의 `request<T>()` 헬퍼 함수를 통해서만 API 호출
- axios 사용 금지 — fetch API 직접 사용
- 병렬 호출 시 `Promise.all()` 사용

**오버레이 페이지 규칙**
- 세부 페이지는 `position: fixed + z-index: 10 + slide-in 애니메이션` 적용
- 뒤로가기: `isLeaving` 상태 → slide-out 애니메이션 → `onAnimationEnd`에서 `navigate(-1)`

---

## 문서 갱신 가이드

새 기능 또는 구조 변경 시 함께 갱신해야 하는 문서.

| 변경 내용 | 갱신 문서 |
| --------- | --------- |
| 새 API 엔드포인트 추가 | `docs/api.md`, 해당 `features/*.md` |
| 새 엔티티/컬럼 추가 | `docs/erd.md`, 해당 `features/*.md` |
| 새 도메인 모듈 추가 | `docs/architecture.md`, `docs/api.md`, `CLAUDE.md` 문서지도, 새 `features/*.md` 생성 |
| 인증 방식 변경 | `docs/security.md`, `features/auth.md`, `docs/architecture.md` |
| 코딩 컨벤션 변경 | `docs/coding-style.md`, `CLAUDE.md` 핵심 규칙 |
| 새 페이지/컴포넌트 추가 | `docs/architecture.md` (라우팅 구조), 해당 `features/*.md` |
| 배포 환경 변경 | `docs/project-overview.md` |

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
