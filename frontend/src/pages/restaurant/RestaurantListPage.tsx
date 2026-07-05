// 전체 맛집 목록 페이지 — 정렬(최신·거리·가나다) + 카테고리 필터
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { restaurantsApi, pinsApi } from '../../api/restaurants';
import type { Restaurant, Pin } from '../../api/restaurants';
import RestaurantCard from '../../components/RestaurantCard';
import { haversineKm } from '../../utils/distance';
import './RestaurantListPage.css';

const CATEGORIES = ['전체', '한식', '중식', '일식', '양식', '분식', '카페/디저트', '치킨/피자', '고기/구이', '해산물'];

type SortKey = 'latest' | 'distance' | 'name';

export default function RestaurantListPage() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [myPins, setMyPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [sortKey, setSortKey] = useState<SortKey>('latest');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    Promise.all([restaurantsApi.getAll(), pinsApi.getMyPins()])
      .then(([r, p]) => { setRestaurants(r); setMyPins(p); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
    );
  }, []);

  const pinnedIds = new Set(myPins.map((p) => p.restaurantId));

  const filtered = restaurants.filter(
    (r) => selectedCategory === '전체' || r.category === selectedCategory,
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === 'name') return a.name.localeCompare(b.name, 'ko');
    if (sortKey === 'distance' && userLocation) {
      const da = haversineKm(userLocation.lat, userLocation.lng, Number(a.latitude), Number(a.longitude));
      const db = haversineKm(userLocation.lat, userLocation.lng, Number(b.latitude), Number(b.longitude));
      return da - db;
    }
    return b.id - a.id; // 최신순
  });

  return (
    <div className="rl-page">
      <header className="rl-header">
        <button className="rl-back" onClick={() => navigate(-1)} aria-label="뒤로가기">
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>
        <h1 className="rl-title">전체 맛집</h1>
        <span className="rl-count">{sorted.length}개</span>
      </header>

      <div className="rl-sort">
        <button
          className={`rl-sort__btn ${sortKey === 'latest' ? 'rl-sort__btn--active' : ''}`}
          onClick={() => setSortKey('latest')}
        >
          최신순
        </button>
        <button
          className={`rl-sort__btn ${sortKey === 'distance' ? 'rl-sort__btn--active' : ''}`}
          onClick={() => setSortKey('distance')}
          disabled={!userLocation}
          title={userLocation ? '' : '위치를 허용하면 사용할 수 있어요'}
        >
          거리순
        </button>
        <button
          className={`rl-sort__btn ${sortKey === 'name' ? 'rl-sort__btn--active' : ''}`}
          onClick={() => setSortKey('name')}
        >
          가나다순
        </button>
      </div>

      <div className="rl-cats">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`rl-pill ${selectedCategory === cat ? 'rl-pill--active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rl-grid">
          {[...Array(8)].map((_, i) => <div key={i} className="rl-skeleton" />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="rl-empty">
          <p>🍽️</p>
          <p>식당이 없어요</p>
        </div>
      ) : (
        <div className="rl-grid">
          {sorted.map((r) => (
            <RestaurantCard
              key={r.id}
              restaurant={r}
              pinned={pinnedIds.has(r.id)}
              myPin={myPins.find((p) => p.restaurantId === r.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
