# Feature: Notifications (알림)

---

## 개요

조회 시점에 계산하는 방식(polling). 두 가지 알림을 제공한다.
- **근처 새 맛집** — 현재 위치 반경 내 최근 등록된 식당
- **내 핀 식당 새 리뷰** — 내가 핀한 식당에 다른 유저가 남긴 리뷰

---

## 관련 파일

### 백엔드
| 파일 | 역할 |
| ---- | ---- |
| `backend/src/notifications/notifications.service.ts` | 알림 계산 로직 |
| `backend/src/notifications/notifications.controller.ts` | GET /notifications |
| `backend/src/notifications/notifications.module.ts` | 모듈 정의 |

### 프론트엔드
| 파일 | 역할 |
| ---- | ---- |
| `frontend/src/pages/NotificationsPage.tsx` | 알림 목록 화면 |
| `frontend/src/pages/NotificationSettingsPage.tsx` | 알림 설정 화면 |
| `frontend/src/pages/HomePage.tsx` | 벨 아이콘 + 읽지 않은 알림 점 |
| `frontend/src/utils/notiSettings.ts` | localStorage 설정 헬퍼 |
| `frontend/src/api/restaurants.ts` | `notificationsApi` 클라이언트 |

---

## 알림 종류

| type | 발생 조건 | 데이터 소스 |
| ---- | --------- | ----------- |
| `new_restaurant` | 반경 내 최근 N일 등록 식당 | restaurant.createdAt |
| `new_review` | 내 핀 식당에 다른 유저가 핀 등록 | pin (restaurantId IN myPins, userId ≠ me) |

---

## 백엔드 알림 계산 상수

```typescript
// notifications.service.ts
const NEARBY_RADIUS_KM = 5;    // 기본 반경 (query로 override 가능)
const NEARBY_DAYS = 3;         // 최근 N일 이내 등록된 식당
const NEARBY_LIMIT = 5;        // 근처 새 맛집 최대 개수
const REVIEW_LIMIT = 20;       // 새 리뷰 최대 개수
```

---

## 서비스 로직

```typescript
async getNotifications(userId, lat?, lng?, radiusKm?) {
  const items: NotificationItem[] = [];

  // 1. 내 핀 식당의 타인 리뷰
  const myPins = await this.pinRepo.find({ where: { userId } });
  const myRestaurantIds = myPins.map(p => p.restaurantId);
  if (myRestaurantIds.length > 0) {
    const reviews = await this.pinRepo.find({
      where: { restaurantId: In(myRestaurantIds), userId: Not(userId) },
      relations: { user: true, restaurant: true },
      order: { createdAt: 'DESC' },
      take: REVIEW_LIMIT,
    });
    // → NotificationItem { type: 'new_review', ... }
  }

  // 2. 근처 새 맛집 (lat/lng 있을 때만)
  if (lat != null && lng != null) {
    const since = new Date(Date.now() - NEARBY_DAYS * 24 * 60 * 60 * 1000);
    const recent = await this.restaurantRepo.find({
      where: { createdAt: MoreThanOrEqual(since) },
      order: { createdAt: 'DESC' },
      take: 100,
    });
    const nearby = recent
      .filter(r => haversineKm(lat, lng, r.latitude, r.longitude) <= (radiusKm ?? NEARBY_RADIUS_KM))
      .slice(0, NEARBY_LIMIT);
    // → NotificationItem { type: 'new_restaurant', ... }
  }

  items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return items;
}
```

---

## 알림 설정 (프론트엔드)

`localStorage`에 저장. `utils/notiSettings.ts` 헬퍼 사용.

```typescript
export const NOTI_KEYS = {
  nearby: 'noti_nearby_enabled',   // 기본: true
  review: 'noti_review_enabled',   // 기본: true
  radius: 'noti_radius_km',        // 기본: 5
};

export function getNotiSettings(): NotiSettings {
  return {
    nearbyEnabled: localStorage.getItem(NOTI_KEYS.nearby) !== 'false',
    reviewEnabled: localStorage.getItem(NOTI_KEYS.review) !== 'false',
    radiusKm: Number(localStorage.getItem(NOTI_KEYS.radius) || '5'),
  };
}
```

`NotificationSettingsPage`: 토글 스위치(근처 알림, 리뷰 알림) + 반경 선택(1km / 5km / 10km)

---

## 읽지 않은 알림 표시 (홈 화면 벨 아이콘)

```typescript
const NOTI_LAST_SEEN_KEY = 'noti_last_seen';

// NotificationsPage 진입 시 기록
localStorage.setItem(NOTI_LAST_SEEN_KEY, new Date().toISOString());

// HomePage: 읽지 않은 알림 여부 확인
const lastSeen = localStorage.getItem(NOTI_LAST_SEEN_KEY);
const hasUnread = filtered.some(
  (n) => !lastSeen || new Date(n.createdAt) > new Date(lastSeen)
);
// hasUnread === true → 벨 아이콘에 빨간 점 표시
```

---

## 프론트엔드 타입

```typescript
export interface NotificationItem {
  type: 'new_restaurant' | 'new_review';
  restaurantId: number;
  restaurantName: string;
  message: string;
  createdAt: string;
}
```

---

## 알림 화면 동작

1. 페이지 진입 시 `navigator.geolocation.getCurrentPosition()` 호출
2. 위치 획득 성공 → `notificationsApi.get(lat, lng, radiusKm)`
3. 위치 거부 또는 미지원 → `notificationsApi.get()` (lat/lng 없이 → 맛집 알림 제외)
4. 설정값으로 클라이언트 필터링:
   - `nearbyEnabled = false` → `new_restaurant` 항목 제거
   - `reviewEnabled = false` → `new_review` 항목 제거
5. 항목 클릭 → `navigate('/restaurants/${restaurantId}')`
6. 진입 완료 시 `noti_last_seen` 업데이트

---

## 알림 화면 오버레이 패턴

`NotificationsPage`, `NotificationSettingsPage` 모두 `position: fixed` 슬라이드 오버레이로 구현.
→ 패턴 상세: [docs/coding-style.md](../docs/coding-style.md#오버레이-페이지-css-패턴)

---

## 갱신 트리거

이 파일을 갱신해야 하는 경우.
- 알림 종류 추가 시
- 알림 계산 상수 변경 시
- 실시간 알림(WebSocket / FCM) 도입 시
- 알림 설정 항목 추가 시
