import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { restaurantsApi, pinsApi } from '../api/restaurants';
import type { Restaurant, Pin } from '../api/restaurants';
import RestaurantCard from '../components/RestaurantCard';
import './HomePage.css';

const CATEGORIES = ['전체', '한식', '중식', '일식', '양식', '분식', '카페/디저트', '치킨/피자', '고기/구이', '해산물', '패스트푸드', '술집/포차'];

export default function HomePage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [myPins, setMyPins] = useState<Pin[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([restaurantsApi.getAll(), pinsApi.getMyPins()])
      .then(([r, p]) => { setRestaurants(r); setMyPins(p); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const pinnedIds = new Set(myPins.map((p) => p.restaurantId));

  const filtered = selectedCategory === '전체'
    ? restaurants
    : restaurants.filter((r) => r.category === selectedCategory);

  return (
    <div className="home-page">
      {/* 모바일 전용 헤더 */}
      <header className="home-header">
        <div>
          <h1 className="home-title">FoodPin</h1>
          <p className="home-subtitle">핀한 맛집 <strong>{myPins.length}</strong>곳</p>
        </div>
        <button className="home-bell" aria-label="알림">
          <Bell size={20} strokeWidth={1.8} />
        </button>
      </header>

      {/* PC 전용 배너 */}
      <div className="home-banner">
        <div className="home-banner__inner">
          <h2>맛집을 발견하고<br />나만의 핀을 꽂아보세요</h2>
          <p>전국 <strong>{restaurants.length}개</strong>의 식당이 등록되어 있어요</p>
        </div>
      </div>

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

      {loading ? (
        <div className="home-loading">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="home-empty">
          <p>🍽️</p>
          <p>식당이 없어요</p>
        </div>
      ) : (
        <div className="restaurant-grid">
          {filtered.map((r) => (
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
