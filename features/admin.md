# Feature: Admin (관리자)

---

## 개요

관리자 전용 로그인/세션 + 회원관리·앱관리(식당/리뷰/문의) 기능.

**설계 원칙**
- 관리자는 소셜 로그인(카카오/네이버) 대상이 아니다 — 이메일+비밀번호로만 로그인
- 일반 유저 세션(`localStorage.token`)과 완전히 분리된 `localStorage.admin_token` 사용 (같은 브라우저에서 유저/관리자 세션 동시 유지 가능)
- 최초 관리자 계정은 일반 회원가입 후 DB에서 `user.role`을 `admin`으로 수동 변경 (문의를 DB에서 수동 입력하던 것과 같은 패턴)
- 정지(`isBanned`)/삭제된 유저는 **즉시** 세션이 끊긴다 — `JwtStrategy`가 매 요청마다 DB를 재조회해서 확인하기 때문에, 이미 로그인해있던 기존 토큰도 다음 요청부터 401로 거부된다. 관리자 자신을 정지/삭제해도 동일하게 즉시 로그아웃된다.

---

## 관련 파일

### 백엔드
| 파일 | 역할 |
| ---- | ---- |
| `backend/src/users/role.constants.ts` | `ROLES = ['user', 'admin']` |
| `backend/src/users/user.entity.ts` | `role`, `isBanned` 컬럼 |
| `backend/src/auth/auth.service.ts` | `adminLogin()` — role이 admin인 계정만 로그인 허용, 정지 계정 차단 |
| `backend/src/auth/strategies/jwt.strategy.ts` | 매 요청마다 `isBanned` 재확인 |
| `backend/src/auth/auth.controller.ts` | `POST /auth/admin/login`, `GET /auth/admin/me` |
| `backend/src/auth/guards/admin.guard.ts` | `JwtAuthGuard` 통과 후 `role === 'admin'` 검사 |
| `backend/src/admin/admin.service.ts` | 회원/식당/리뷰/문의 관리 로직 (소유권 체크 없이 전체 접근) |
| `backend/src/admin/admin.controller.ts` | `/admin/*` 엔드포인트, 전부 `JwtAuthGuard`+`AdminGuard` |
| `backend/src/admin/dto/ban-user.dto.ts` | 정지/해제 요청 DTO |
| `backend/src/admin/dto/answer-inquiry.dto.ts` | 문의 답변 요청 DTO |

### 프론트엔드
| 파일 | 역할 |
| ---- | ---- |
| `frontend/src/api/admin.ts` | `adminAuthApi`, `adminApi` — `admin_token` 기반 별도 요청 헬퍼 |
| `frontend/src/pages/admin/AdminLoginPage.tsx` | 관리자 로그인 폼 (소셜 로그인 버튼 없음) |
| `frontend/src/pages/admin/AdminLayout.tsx` | 공통 헤더 + 탭 네비게이션 (대시보드/회원관리/식당관리/리뷰관리/문의관리) |
| `frontend/src/pages/admin/AdminDashboardPage.tsx` | 요약 통계 (회원 수, 식당 수, 미답변 문의 수) |
| `frontend/src/pages/admin/AdminUsersPage.tsx` | 회원 검색, 정지/해제, 삭제 |
| `frontend/src/pages/admin/AdminRestaurantsPage.tsx` | 식당 검색, 삭제 |
| `frontend/src/pages/admin/AdminPinsPage.tsx` | 전체 리뷰(핀) 조회, 삭제 |
| `frontend/src/pages/admin/AdminInquiriesPage.tsx` | 문의 조회, 답변 등록/수정 |
| `frontend/src/App.tsx` | `AdminRoute` — `admin_token` 존재 여부만 클라이언트에서 확인 (`PrivateRoute`와 동일 패턴) |

---

## API

| Method | URL | 설명 |
| ------ | --- | ---- |
| POST | /auth/admin/login | 관리자 로그인 |
| GET | /auth/admin/me | 관리자 세션 확인 |
| GET | /admin/stats | 요약 통계 |
| GET | /admin/users | 회원 목록 (검색) |
| PATCH | /admin/users/:id/ban | 정지/해제 |
| DELETE | /admin/users/:id | 회원 삭제 |
| GET | /admin/restaurants | 식당 목록 (검색) |
| DELETE | /admin/restaurants/:id | 식당 삭제 (소유권 무관) |
| GET | /admin/pins | 전체 리뷰 목록 |
| DELETE | /admin/pins/:id | 리뷰 삭제 |
| GET | /admin/inquiries | 전체 문의 목록 |
| PATCH | /admin/inquiries/:id/answer | 답변 등록 |

상세는 [docs/api.md](../docs/api.md#admin) 참고.

---

## 스코프에서 제외한 것

- **식당 정보 수정** — 관리자는 삭제만 가능. 편집(이름/메뉴/영업시간 등)은 기존 `RestaurantForm` 재사용이 필요해 이번 스코프에서 제외했다. 부적절한 콘텐츠 제거가 목적이라 삭제만으로 충분하다고 판단.
- **페이지네이션** — 회원/식당/리뷰/문의 목록 모두 전체 조회. 데이터가 많아지면 추가 고려.
- **감사 로그(audit log)** — 누가 언제 정지/삭제했는지 기록하지 않는다.
- **대시보드 통계 확장** — 가입 추이 그래프, 인기 식당 랭킹 등은 없음.

---

## 갱신 트리거

이 파일을 갱신해야 하는 경우.
- 식당 편집, 페이지네이션, 감사 로그 등 스코프 밖 기능 추가 시
- `role` 값 종류 추가 시 (예: `moderator`)
- 정지 정책 변경 시 (예: 기간제 정지)
