import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, MapPin } from 'lucide-react';
import { restaurantsApi, pinsApi, photoSrc, notificationsApi } from '../api/restaurants';
import type { Restaurant, Pin } from '../api/restaurants';
import RestaurantCard from '../components/RestaurantCard';
import { haversineKm } from '../utils/distance';
import { NOTI_LAST_SEEN_KEY } from './NotificationsPage';
import './HomePage.css';

const CATEGORIES = ['전체', '한식', '중식', '일식', '양식', '분식', '카페/디저트', '치킨/피자', '고기/구이', '해산물'];

const NEARBY_RADIUS_KM = 20;

export default function HomePage() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [myPins, setMyPins] = useState<Pin[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [hasUnreadNoti, setHasUnreadNoti] = useState(false);

  useEffect(() => {
    Promise.all([restaurantsApi.getAll(), pinsApi.getMyPins()])
      .then(([r, p]) => { setRestaurants(r); setMyPins(p); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // 현재 위치 획득 (거부/미지원 시 위치 필터 없이 전체 표시)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
    );
  }, []);

  // 안 읽은 알림 여부 확인 (벨 아이콘 빨간 점)
  useEffect(() => {
    notificationsApi.get(userLocation?.lat, userLocation?.lng)
      .then((items) => {
        const lastSeen = localStorage.getItem(NOTI_LAST_SEEN_KEY);
        const unread = items.some(
          (n) => !lastSeen || new Date(n.createdAt) > new Date(lastSeen),
        );
        setHasUnreadNoti(unread);
      })
      .catch(() => {});
  }, [userLocation]);

  const pinnedIds = new Set(myPins.map((p) => p.restaurantId));

  // 위치가 있으면 반경 20km 이내로 제한, 없으면 전체
  const nearby = userLocation
    ? restaurants.filter(
        (r) =>
          haversineKm(userLocation.lat, userLocation.lng, Number(r.latitude), Number(r.longitude)) <=
          NEARBY_RADIUS_KM,
      )
    : restaurants;

  const filtered = nearby
    .filter((r) => selectedCategory === '전체' || r.category === selectedCategory)
    .filter((r) => !searchQuery || r.name.includes(searchQuery) || r.address?.includes(searchQuery) || r.category?.includes(searchQuery));

  const hotRestaurants = nearby.slice(0, 5);

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-header__left">
          <div className="home-location-dot">
            <MapPin size={12} strokeWidth={2.5} />
          </div>
          <div>
            <p className="home-location-label">현재 위치</p>
            <h1 className="home-title">FoodPin</h1>
          </div>
        </div>
        <div className="home-header__right">
          <button className="home-icon-btn" aria-label="알림" onClick={() => navigate('/notifications')}>
            <Bell size={18} strokeWidth={1.8} />
            {hasUnreadNoti && <span className="home-noti-dot" />}
          </button>
          <div className="home-avatar">👤</div>
        </div>
      </header>

      <div className="home-search-wrap">
        <div className="home-search-box">
          <Search size={15} strokeWidth={2} className="home-search-icon" />
          <input
            className="home-search"
            placeholder="레스토랑, 음식 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="home-body">
        <div className="category-scroll">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`cat-pill ${selectedCategory === cat ? 'cat-pill--active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {selectedCategory === '전체' && (
          <>
            <div className="home-section-header">
              <span className="home-section-title">🔥 지금 핫한 맛집</span>
              <button className="home-section-more" onClick={() => navigate('/restaurants')}>전체보기 &gt;</button>
            </div>
            <div className="hot-scroll">
              {hotRestaurants.map((r) => (
                <div key={r.id} className="hot-card" onClick={() => navigate(`/restaurants/${r.id}`)}>
                  {r.photoUrl ? (
                    <img src={photoSrc(r.photoUrl)} alt={r.name} className="hot-card__img" />
                  ) : (
                    <div className="hot-card__no-img">🍽️</div>
                  )}
                  <div className="hot-card__overlay" />
                  <span className="hot-badge">🔥 HOT</span>
                  <p className="hot-card__name">{r.name}</p>
                </div>
              ))}
            </div>

            <div className="home-section-header" style={{ marginTop: 24 }}>
              <span className="home-section-title">주변 맛집</span>
              <span className="home-section-count">{nearby.length}개</span>
            </div>
          </>
        )}

        {selectedCategory !== '전체' && (
          <div className="home-section-header">
            <span className="home-section-title">{selectedCategory} 맛집</span>
            <span className="home-section-count">{filtered.length}개</span>
          </div>
        )}

        {loading ? (
          <div className="restaurant-grid">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="home-empty">
            <p>🍽️</p>
            <p>식당이 없어요</p>
          </div>
        ) : (
          <div className="restaurant-grid">
            {filtered.map((r, i) => (
              <RestaurantCard
                key={r.id}
                restaurant={r}
                pinned={pinnedIds.has(r.id)}
                myPin={myPins.find((p) => p.restaurantId === r.id)}
                hot={i < 3}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
