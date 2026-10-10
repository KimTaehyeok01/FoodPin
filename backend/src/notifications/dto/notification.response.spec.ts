// 알림 응답 계약(종류 상수·항목 키 5개)을 고정하는 회귀 테스트
import {
  NOTIFICATION_TYPES,
  NotificationResponse,
} from './notification.response.dto';

// 서비스가 조립해 내보내는 알림 항목 키 5개
const NOTIFICATION_KEYS = [
  'type',
  'restaurantId',
  'restaurantName',
  'message',
  'createdAt',
];

// notifications.service.ts가 내 핀 식당의 새 리뷰로 조립하는 항목을 그대로 재현한다.
// NotificationResponse 타입 주석이 필드 누락·초과를 컴파일 타임에 막는다 (저장 엔티티가 없어 정적 팩토리도 없다).
const mockReviewNotification = (): NotificationResponse => ({
  type: 'new_review',
  restaurantId: 111,
  restaurantName: '성남 정자동 순대국',
  message: "길동이님이 '성남 정자동 순대국'에 리뷰를 남겼어요",
  createdAt: new Date('2026-07-30T10:00:00.000Z'),
});

// 근처 새 맛집으로 조립하는 항목
const mockRestaurantNotification = (): NotificationResponse => ({
  type: 'new_restaurant',
  restaurantId: 222,
  restaurantName: '분당 카페거리 파스타',
  message: "근처에 새 맛집 '분당 카페거리 파스타'이(가) 등록되었어요",
  createdAt: new Date('2026-07-31T09:00:00.000Z'),
});

describe('NotificationResponse', () => {
  it('알림 종류 상수는 new_restaurant·new_review 2종을 유지한다', () => {
    // Given & When & Then
    expect(NOTIFICATION_TYPES).toEqual(['new_restaurant', 'new_review']);
  });

  it('리뷰 알림 항목이 현행 응답 키 5개를 유지한다', () => {
    // Given & When
    const keys = Object.keys(mockReviewNotification()).sort();

    // Then
    expect(keys).toEqual([...NOTIFICATION_KEYS].sort());
  });

  it('새 맛집 알림 항목도 동일한 키 5개를 유지한다', () => {
    // Given & When
    const keys = Object.keys(mockRestaurantNotification()).sort();

    // Then
    expect(keys).toEqual([...NOTIFICATION_KEYS].sort());
  });

  it('서비스가 쓰는 type 값은 모두 알림 종류 상수 안에 있다', () => {
    // Given
    const items = [mockReviewNotification(), mockRestaurantNotification()];

    // When
    const types = items.map((item) => item.type);

    // Then
    types.forEach((type) => expect(NOTIFICATION_TYPES).toContain(type));
  });
});
