# Feature: Admin (관리자)

---

## 개요

관리자 전용 로그인/세션. 회원관리·앱관리 등 관리 기능은 아직 없고, 이번 단계에서는 로그인·세션 확인까지만 구현했다.

**설계 원칙**
- 관리자는 소셜 로그인(카카오/네이버) 대상이 아니다 — 이메일+비밀번호로만 로그인
- 일반 유저 세션(`localStorage.token`)과 완전히 분리된 `localStorage.admin_token` 사용 (같은 브라우저에서 유저/관리자 세션 동시 유지 가능)
- 최초 관리자 계정은 일반 회원가입 후 DB에서 `user.role`을 `admin`으로 수동 변경 (문의 답변을 DB에서 수동 입력하는 것과 같은 패턴)

---

## 관련 파일

### 백엔드
| 파일 | 역할 |
| ---- | ---- |
| `backend/src/users/role.constants.ts` | `ROLES = ['user', 'admin']` |
| `backend/src/users/user.entity.ts` | `role` 컬럼 |
| `backend/src/auth/auth.service.ts` | `adminLogin()` — role이 admin인 계정만 로그인 허용 |
| `backend/src/auth/auth.controller.ts` | `POST /auth/admin/login`, `GET /auth/admin/me` |
| `backend/src/auth/guards/admin.guard.ts` | `JwtAuthGuard` 통과 후 `role === 'admin'` 검사 |

### 프론트엔드
| 파일 | 역할 |
| ---- | ---- |
| `frontend/src/api/admin.ts` | `adminAuthApi` — `admin_token` 기반 별도 요청 헬퍼 |
| `frontend/src/pages/admin/AdminLoginPage.tsx` | 관리자 로그인 폼 (소셜 로그인 버튼 없음) |
| `frontend/src/pages/admin/AdminDashboardPage.tsx` | 로그인 후 진입하는 placeholder 페이지 |
| `frontend/src/App.tsx` | `AdminRoute` — `admin_token` 존재 여부만 클라이언트에서 확인 |

---

## API

| Method | URL | 설명 |
| ------ | --- | ---- |
| POST | /auth/admin/login | 관리자 로그인 (이메일+비밀번호, role 검사) |
| GET | /auth/admin/me | 관리자 세션 확인 (`JwtAuthGuard` + `AdminGuard`) |

상세는 [docs/api.md](../docs/api.md#post-authadminlogin) 참고.

---

## TODO (다음 단계)

- 회원관리: 목록/검색, 상세, 정지/삭제
- 앱(콘텐츠) 관리: 식당 CRUD(관리자 권한으로 전체 접근), 부적절 리뷰 삭제, 문의 답변 등록
- 대시보드 통계 (가입자 수, 미답변 문의 수 등)
- 새 관리자 전용 엔드포인트는 `@UseGuards(JwtAuthGuard, AdminGuard)` 패턴 재사용

---

## 갱신 트리거

이 파일을 갱신해야 하는 경우.
- 회원관리/앱관리 등 관리자 기능 추가 시
- `role` 값 종류 추가 시 (예: `moderator`)
