# Feature: Pins (핀 · 별점 · 메모)

---

## 개요

유저가 식당에 별점(1~5)과 메모를 남기는 기능.
한 유저는 한 식당에 핀 1개만 등록할 수 있다 (`(userId, restaurantId)` UNIQUE).
"찜한 맛집" 목록은 내 핀 목록(`GET /pins/me`)을 기반으로 한다.

---

## 관련 파일

### 백엔드
| 파일 | 역할 |
| ---- | ---- |
| `backend/src/pins/pin.entity.ts` | 핀 엔티티 |
| `backend/src/pins/pins.service.ts` | 핀 CRUD 서비스 |
| `backend/src/pins/pins.controller.ts` | REST 엔드포인트 |
| `backend/src/pins/dto/create-pin.dto.ts` | 핀 생성 DTO |

### 프론트엔드
| 파일 | 역할 |
| ---- | ---- |
| `frontend/src/components/RestaurantCard.tsx` | 카드 내 핀 토글 버튼 |
| `frontend/src/components/PinForm.tsx` | 별점·메모 수정 폼 |
| `frontend/src/pages/my/FavoritesPage.tsx` | 찜한 맛집 목록 |
| `frontend/src/pages/restaurant/RestaurantDetailPage.tsx` | 리뷰 탭 (식당의 모든 핀) |
| `frontend/src/api/restaurants.ts` | `pinsApi` 클라이언트 |

---

## 엔티티

`Pin` — 상세는 [docs/erd.md](../docs/erd.md) 참고.

```typescript
@Entity()
@Unique(['userId', 'restaurantId'])
export class Pin {
  @PrimaryGeneratedColumn() id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
  @Column() userId: number;

  @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;
  @Column() restaurantId: number;

  @Column({ type: 'tinyint', unsigned: true, default: 3 })
  rating: number;  // 1~5

  @Column({ type: 'text', nullable: true })
  memo: string | null;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
```

---

## API

| Method | URL | 설명 |
| ------ | --- | ---- |
| GET | /pins/me | 내 핀 목록 (restaurant 포함) |
| GET | /pins/restaurant/:id | 특정 식당의 모든 핀 (user 정보 포함) |
| POST | /pins/:restaurantId | 핀 등록 |
| PATCH | /pins/:restaurantId | 핀 수정 |
| DELETE | /pins/:restaurantId | 핀 삭제 (204) |

모두 `JwtAuthGuard` 적용 (컨트롤러 레벨).

---

## 서비스 핵심 로직

### getMyPins

```typescript
return this.pinRepo.find({
  where: { userId },
  relations: { restaurant: true },
  order: { createdAt: 'DESC' },
});
```

### getRestaurantPins (식당의 리뷰 목록)

```typescript
return this.pinRepo.find({
  where: { restaurantId },
  relations: { user: true },
  select: { user: { id: true, nickname: true, profileImage: true } },
  order: { createdAt: 'DESC' },
});
```

### pin (핀 등록)

```typescript
const existing = await this.pinRepo.findOneBy({ userId, restaurantId });
if (existing) throw new ConflictException('이미 핀한 식당입니다.');
const pin = this.pinRepo.create({ userId, restaurantId, ...dto });
return this.pinRepo.save(pin);
```

### updatePin

```typescript
const pin = await this.pinRepo.findOneBy({ userId, restaurantId });
if (!pin) throw new NotFoundException('핀을 찾을 수 없습니다.');
Object.assign(pin, dto);
return this.pinRepo.save(pin);
```

### isPinned

```typescript
return !!(await this.pinRepo.findOneBy({ userId, restaurantId }));
```

---

## 프론트엔드 핵심 패턴

### RestaurantCard 내 핀 토글

```tsx
// 카드에서 핀 버튼 클릭 → 핀/언핀 전환
const handlePin = async (e: React.MouseEvent) => {
  e.stopPropagation();  // 카드 클릭(상세 이동) 방지
  if (pinned) {
    await pinsApi.unpin(restaurant.id);
  } else {
    await pinsApi.pin(restaurant.id, { rating: 3 });
  }
};
```

### 찜 목록 (FavoritesPage)

- `pinsApi.getMyPins()` 조회 → `pin.restaurant` 접근
- 거리 표시: `haversineKm()` 활용
- 찜 해제: `pinsApi.unpin(restaurantId)` → 로컬 상태에서 제거

### 리뷰 탭 (RestaurantDetailPage)

- `pinsApi.getForRestaurant(id)` 조회
- `RestaurantPin` 타입: user 정보(nickname, profileImage) + rating + memo

---

## 프론트엔드 타입

```typescript
// 내 핀 (restaurant 포함)
export interface Pin {
  id: number;
  userId: number;
  restaurantId: number;
  rating: number;
  memo: string | null;
  createdAt: string;
  restaurant: Restaurant;
}

// 식당 리뷰 (user 정보 포함)
export interface RestaurantPin {
  id: number;
  userId: number;
  restaurantId: number;
  rating: number;
  memo: string | null;
  createdAt: string;
  user: {
    id: number;
    nickname: string;
    profileImage: string | null;
  };
}
```

---

## 갱신 트리거

이 파일을 갱신해야 하는 경우.
- 핀 엔티티 필드 추가 시 (예: 방문 날짜, 태그)
- 별점 범위 변경 시
- 리뷰 표시 방식 변경 시
