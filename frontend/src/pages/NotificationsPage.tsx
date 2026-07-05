// 알림 페이지 — 근처 새 맛집 + 내 핀 식당의 새 리뷰
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Star, MapPin } from 'lucide-react';
import { notificationsApi } from '../api/restaurants';
import type { NotificationItem } from '../api/restaurants';
import './NotificationsPage.css';

export const NOTI_LAST_SEEN_KEY = 'noti_last_seen';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = (lat?: number, lng?: number) => {
      notificationsApi.get(lat, lng)
        .then(setItems)
        .catch(console.error)
        .finally(() => {
          setLoading(false);
          // 확인 시각 기록 → 안읽음 뱃지 해제
          localStorage.setItem(NOTI_LAST_SEEN_KEY, new Date().toISOString());
        });
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => load(pos.coords.latitude, pos.coords.longitude),
        () => load(),
      );
    } else {
      load();
    }
  }, []);

  return (
    <div className="noti-page">
      <header className="noti-header">
        <button className="noti-back" onClick={() => navigate(-1)} aria-label="뒤로가기">
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>
        <h1 className="noti-title">알림</h1>
      </header>

      <div className="noti-body">
        {loading ? (
          <div className="noti-list">
            {[...Array(4)].map((_, i) => <div key={i} className="noti-skeleton" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="noti-empty">
            <p>🔔</p>
            <p>새로운 알림이 없어요</p>
          </div>
        ) : (
          <div className="noti-list">
            {items.map((n, i) => (
              <button
                key={i}
                className="noti-item"
                onClick={() => navigate(`/restaurants/${n.restaurantId}`)}
              >
                <div className={`noti-item__icon noti-item__icon--${n.type}`}>
                  {n.type === 'new_review' ? (
                    <Star size={17} strokeWidth={2} />
                  ) : (
                    <MapPin size={17} strokeWidth={2} />
                  )}
                </div>
                <div className="noti-item__body">
                  <p className="noti-item__msg">{n.message}</p>
                  <span className="noti-item__date">
                    {new Date(n.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
