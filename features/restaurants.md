# Feature: Restaurants (식당)

---

## 개요

식당 정보의 CRUD와 메뉴 관리를 담당한다.
지도(카카오맵)와 연동하여 위치 기반으로 등록하고, 홈화면과 지도 탭에서 표시된다.

---

## 관련 파일

### 백엔드
| 파일 | 역할 |
| ---- | ---- |
| `backend/src/restaurants/restaurant.entity.ts` | 식당 엔티티 |
| `backend/src/restaurants/restaurant-menu.entity.ts` | 메뉴 엔티티 |
| `backend/src/restaurants/restaurants.service.ts` | CRUD 서비스 로직 |
| `backend/src/restaurants/restaurants.controller.ts` | REST 엔드포인트 |
| `backend/src/restaurants/dto/create-restaurant.dto.ts` | 등록 DTO |
| `backend/src/restaurants/dto/update-restaurant.dto.ts` | 수정 DTO |

### 프론트엔드
| 파일 | 역할 |
| ---- | ---- |
| `frontend/src/pages/HomePage.tsx` | 홈 화면 (카드 그리드, 검색, 카테고리 필터) |
| `frontend/src/pages/MapPage.tsx` | 지도 탭 (카카오맵 핀) |
| `frontend/src/pages/restaurant/RestaurantDetailPage.tsx` | 식당 상세 (탭: 정보·메뉴·리뷰) |
| `frontend/src/pages/restaurant/RestaurantListPage.tsx` | 전체 목록 오버레이 |
| `frontend/src/components/RestaurantCard.tsx` | 홈 그리드 카드 컴포넌트 |
| `frontend/src/components/KakaoMap.tsx` | 지도 컴포넌트 |
| `frontend/src/components/AddPinForm.tsx` | 지도 클릭 후 식당 등록 폼 |
| `frontend/src/api/restaurants.ts` | API 클라이언트 (`restaurantsApi`) |

---

## 엔티티

`Restaurant` — 상세는 [docs/erd.md](../docs/erd.md) 참고.

핵심 필드.
- `latitude`, `longitude`: `DECIMAL(10,7)` — 카카오맵 좌표
- `userId`: nullable — 시드 데이터는 null (관리자만 수정·삭제 가능)
- `photoUrl`: `/uploads/xxx.jpg` (업로드) 또는 `https://...` (외부 URL) 혼용
- `menus`: `@OneToMany` → `RestaurantMenu`

---

## API

| Method | URL | 인증 | 설명 |
| ------ | --- | ---- | ---- |
| GET | /restaurants | 불필요 | 전체 목록 (createdAt DESC) |
| GET | /restaurants/:id | 불필요 | 단건 + menus 포함 |
| POST | /restaurants | 필요 | 등록 |
| PATCH | /restaurants/:id | 필요 | 수정 (본인만 · null 소유는 관리자만) |
| DELETE | /restaurants/:id | 필요 | 삭제 (본인만 · null 소유는 관리자만) |

자세한 요청/응답 형식 → [docs/api.md](../docs/api.md#restaurants)

---

## 서비스 핵심 로직

### findAll

```typescript
return this.restaurantRepo.find({ order: { createdAt: 'DESC' } });
// menus 미포함 (목록에서는 불필요)
```

### findOne

```typescript
const restaurant = await this.restaurantRepo.findOne({
  where: { id },
  relations: { menus: true },
  order: { menus: { id: 'ASC' } },
});
if (!restaurant) throw new NotFoundException('식당을 찾을 수 없습니다.');
```

### 소유권 체크

```typescript
// assertCanModify — update/remove 공통
// 소유자 본인만 수정·삭제 가능. 소유자 없는(시드) 식당은 관리자만 가능
const allowed =
  restaurant.userId === null ? user.role === 'admin' : restaurant.userId === user.id;
if (!allowed) throw new ForbiddenException(message);
```

---

## 프론트엔드 핵심 패턴

### 이미지 URL 처리

```typescript
// api/restaurants.ts
export function photoSrc(photoUrl: string): string {
  return photoUrl.startsWith('http')
    ? photoUrl                          // 외부 URL 그대로
    : `${BASE_URL}${photoUrl}`;         // /uploads/xxx → API 서버 URL 붙이기
}
```

### 거리 필터링 (홈 화면)

```typescript
// 위치 획득 성공 시 반경 20km 이내만 표시
const NEARBY_RADIUS_KM = 20;
const nearby = userLocation
  ? restaurants.filter((r) =>
      haversineKm(userLocation.lat, userLocation.lng, r.latitude, r.longitude) <= NEARBY_RADIUS_KM
    )
  : restaurants;  // 위치 거부 시 전체 표시
```

### 카테고리 목록

```typescript
const CATEGORIES = [
  '전체', '한식', '중식', '일식', '양식', '분식',
  '카페/디저트', '치킨/피자', '고기/구이', '해산물'
];
```

### 카카오맵 핵심 동작

- `MapPage`: `keep-alive` 패턴 (한 번 마운트 후 `display` 전환)
- `KakaoMap`: 지도 클릭 → 마커 추가 → `AddPinForm` 표시 → 식당 등록
- `display:none` 상태에서 초기화하면 타일이 깨지므로 첫 방문 전까지 마운트 자체를 막음
- 내 위치 버튼: geolocation 획득 → 지도 이동 + 파란 점 마커 표시 (마커는 1개 재사용)

### MapViewHandle (지도 컴포넌트 외부 제어 인터페이스)

```typescript
export interface MapViewHandle {
  moveTo: (lat: number, lng: number) => void;          // 지도 이동 (검색 결과 이동에 사용)
  showMyLocation: (lat: number, lng: number) => void;  // 내 위치 마커 표시 + 이동
}
// 사용: mapViewRef.current?.moveTo(lat, lng)
```

### RestaurantDetailPage 탭 구조

```
[정보] [메뉴] [리뷰]
```

- 정보: 주소, 전화번호, 영업시간, 브레이크타임, 소개글
- 메뉴: `menus` 배열 (이름, 가격, 인기여부, 이모지)
- 리뷰: `GET /pins/restaurant/:id` 응답 (유저 닉네임 + 별점 + 메모)

---

## 갱신 트리거

이 파일을 갱신해야 하는 경우.
- 식당 엔티티 컬럼 추가/변경 시
- 메뉴 관리 기능 추가 시
- 홈 화면 필터/정렬 방식 변경 시
- 카카오맵 연동 방식 변경 시
