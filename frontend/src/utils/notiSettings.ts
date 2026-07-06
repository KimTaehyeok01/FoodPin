// 알림 설정 값을 localStorage에서 읽고 쓰는 헬퍼
export const NOTI_KEYS = {
  nearby: 'noti_nearby_enabled',
  review: 'noti_review_enabled',
  radius: 'noti_radius_km',
};

export interface NotiSettings {
  nearbyEnabled: boolean;
  reviewEnabled: boolean;
  radiusKm: number;
}

export function getNotiSettings(): NotiSettings {
  return {
    nearbyEnabled: localStorage.getItem(NOTI_KEYS.nearby) !== 'false',
    reviewEnabled: localStorage.getItem(NOTI_KEYS.review) !== 'false',
    radiusKm: Number(localStorage.getItem(NOTI_KEYS.radius) || '5'),
  };
}
