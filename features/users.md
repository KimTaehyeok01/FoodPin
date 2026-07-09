# Feature: Users (프로필)

---

## 개요

로그인한 유저의 프로필 조회·수정 기능.
이름, 닉네임, 프로필 사진, 주소, 나이, 성별, 즐겨찾는 카테고리를 변경할 수 있다. 프로필 사진은 upload 기능을 재사용한다.

소셜 로그인 유저의 이름·주소·나이·성별 필수 입력 흐름은 [features/auth.md](auth.md#소셜-로그인-프로필-완성) 참고.

---

## 관련 파일

### 백엔드
| 파일 | 역할 |
| ---- | ---- |
| `backend/src/users/user.entity.ts` | 유저 엔티티 (+ FOOD_CATEGORIES re-export) |
| `backend/src/users/user-favorite-category.entity.ts` | 즐겨찾는 카테고리 엔티티 |
| `backend/src/users/users.service.ts` | 프로필 조회·수정 서비스 |
| `backend/src/users/users.controller.ts` | GET/PATCH /users/me |
| `backend/src/users/users.module.ts` | 모듈 정의 |
| `backend/src/users/dto/update-profile.dto.ts` | 프로필 수정 DTO |

### 프론트엔드
| 파일 | 역할 |
| ---- | ---- |
| `frontend/src/pages/my/MyPage.tsx` | 마이페이지 (프로필 표시, 진입 시마다 재조회) |
| `frontend/src/pages/my/ProfileEditPage.tsx` | 프로필 정보 변경 오버레이 페이지 |
| `frontend/src/api/restaurants.ts` | `usersApi` 클라이언트 |

---

## API

| Method | URL | 설명 |
| ------ | --- | ---- |
| GET | /users/me | 내 프로필 조회 (password 제외) |
| PATCH | /users/me | 프로필 수정 (name, nickname, profileImage, address, age, gender, favoriteCategories) |

모두 `JwtAuthGuard` 적용 (컨트롤러 레벨). 상세 → [docs/api.md](../docs/api.md#users)

---

## 서비스 핵심 로직

### 민감 정보 제외 (PROFILE_SELECT)

```typescript
// password, providerId를 응답에서 제외하기 위한 select 상수
const PROFILE_SELECT = {
  id: true, provider: true, email: true, name: true, nickname: true,
  profileImage: true, address: true, age: true, gender: true, createdAt: true,
} as const;

const user = await this.userRepo.findOne({
  where: { id: userId },
  select: PROFILE_SELECT,
});
```

### updateProfile

```typescript
const user = await this.userRepo.findOneBy({ id: userId });
if (!user) throw new NotFoundException('유저를 찾을 수 없습니다.');

const { favoriteCategories, ...fields } = dto;
Object.assign(user, fields);   // DTO의 정의된 필드만 덮어씀 (whitelist 검증 통과분)
await this.userRepo.save(user);

// favoriteCategories가 오면 기존 값을 전부 지우고 새로 저장 (부분 추가가 아닌 전체 교체)
if (favoriteCategories) {
  await this.favCategoryRepo.delete({ userId });
  if (favoriteCategories.length) {
    await this.favCategoryRepo.save(
      favoriteCategories.map((category) => this.favCategoryRepo.create({ userId, category })),
    );
  }
}

return this.getMe(userId);  // password 제외된 형태로 재조회 후 반환
```

---

## 프론트엔드 핵심 패턴

### 프로필 사진 업로드

기존 `uploadImage()` 재사용. 업로드 후 반환된 URL을 `profileImage` 필드로 저장.

```typescript
const url = await uploadImage(file);   // '/uploads/xxx.jpg'
setProfileImage(url);
// 저장 시: usersApi.updateProfile({ profileImage: url, ... })
```

### MyPage keep-alive 대응

MyPage는 항상 마운트되어 있으므로(`display` 전환), 프로필 수정 후 돌아와도
`useEffect([])`로는 갱신이 안 된다. 경로 감지로 재조회한다.

```typescript
// 마이페이지 탭 진입 시마다 프로필 갱신
useEffect(() => {
  if (location.pathname !== '/mypage') return;
  usersApi.getMe().then(setProfile).catch(console.error);
}, [location.pathname]);
```

### ProfileEditPage

- 오버레이 패턴 (`pe-` prefix, slide-in/out, `isLeaving`)
- 진입 시 `usersApi.getMe()`로 현재 값 로드
- 클라이언트 유효성 검사: 닉네임 필수, 나이 1~120 정수
- 저장 성공 → slide-out → 마이페이지 복귀 (경로 감지로 자동 갱신)

---

## 프론트엔드 타입

```typescript
export interface UserProfile {
  id: number;
  provider: string | null;
  email: string | null;
  name: string | null;
  nickname: string;
  profileImage: string | null;
  address: string | null;
  age: number | null;
  gender: string | null;
  createdAt: string;
}

export interface UpdateProfileDto {
  name?: string;
  nickname?: string;
  profileImage?: string;
  address?: string;
  age?: number;
  gender?: string;
  favoriteCategories?: string[];
}
```

---

## 갱신 트리거

이 파일을 갱신해야 하는 경우.
- 프로필 필드 추가 시 (예: 자기소개)
- 비밀번호 변경 기능 추가 시
- 회원 탈퇴 기능 추가 시
- 즐겨찾는 카테고리 수정 기능 추가 시
