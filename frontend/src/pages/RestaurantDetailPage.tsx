// 식당 상세 페이지 — 정보, 미니 지도, 내 핀 관리, 다른 유저 기록
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Navigation } from 'lucide-react';
import { restaurantsApi, pinsApi, photoSrc } from '../api/restaurants';
import type { Restaurant, Pin, RestaurantPin, CreatePinDto } from '../api/restaurants';
import MapView from '../components/KakaoMap';
import PinForm from '../components/PinForm';
import './RestaurantDetailPage.css';

export default function RestaurantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const restaurantId = Number(id);

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [pins, setPins] = useState<RestaurantPin[]>([]);
  const [myPins, setMyPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPinForm, setShowPinForm] = useState(false);

  useEffect(() => {
    if (!restaurantId) return;
    Promise.all([
      restaurantsApi.getOne(restaurantId),
      pinsApi.getForRestaurant(restaurantId),
      pinsApi.getMyPins(),
    ])
      .then(([r, ps, mine]) => {
        setRestaurant(r);
        setPins(ps);
        setMyPins(mine);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [restaurantId]);

  const myPin = myPins.find((p) => p.restaurantId === restaurantId);
  const otherPins = pins.filter((p) => p.id !== myPin?.id);
  const avgRating =
    pins.length > 0
      ? (pins.reduce((sum, p) => sum + p.rating, 0) / pins.length).toFixed(1)
      : null;

  const refreshPins = () =>
    pinsApi.getForRestaurant(restaurantId).then(setPins).catch(console.error);

  const handlePin = async (dto: CreatePinDto) => {
    try {
      if (myPin) {
        const updated = await pinsApi.update(restaurantId, dto);
        setMyPins((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const created = await pinsApi.pin(restaurantId, dto);
        setMyPins((prev) => [...prev, created]);
      }
      setShowPinForm(false);
      refreshPins();
    } catch {
      alert('핀 저장에 실패했습니다.');
    }
  };

  const handleUnpin = async () => {
    try {
      await pinsApi.unpin(restaurantId);
      setMyPins((prev) => prev.filter((p) => p.restaurantId !== restaurantId));
      setShowPinForm(false);
      refreshPins();
    } catch {
      alert('핀 삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="rd-page">
        <div className="rd-skeleton" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="rd-page">
        <div className="rd-empty">
          <p>🍽️</p>
          <p>식당을 찾을 수 없어요</p>
          <button className="rd-back-link" onClick={() => navigate(-1)}>돌아가기</button>
        </div>
      </div>
    );
  }

  const directionsUrl = `https://map.kakao.com/link/to/${encodeURIComponent(
    restaurant.name,
  )},${restaurant.latitude},${restaurant.longitude}`;

  return (
    <div className="rd-page">
      {/* 사진 헤더 */}
      <div className="rd-hero">
        {restaurant.photoUrl ? (
          <img src={photoSrc(restaurant.photoUrl)} alt={restaurant.name} className="rd-hero__img" />
        ) : (
          <div className="rd-hero__no-img">🍽️</div>
        )}
        <div className="rd-hero__overlay" />
        <button className="rd-back-btn" onClick={() => navigate(-1)} aria-label="뒤로가기">
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>
      </div>

      <div className="rd-body">
        {/* 기본 정보 */}
        <section className="rd-info">
          <div className="rd-info__head">
            <h1 className="rd-name">{restaurant.name}</h1>
            {restaurant.category && <span className="rd-category">{restaurant.category}</span>}
          </div>
          {restaurant.address && (
            <p className="rd-address">
              <MapPin size={13} strokeWidth={2} /> {restaurant.address}
            </p>
          )}
          <div className="rd-stats">
            {avgRating ? (
              <span className="rd-stats__rating">⭐ {avgRating}</span>
            ) : (
              <span className="rd-stats__rating rd-stats__rating--empty">⭐ -</span>
            )}
            <span className="rd-stats__count">📌 {pins.length}명이 핀했어요</span>
          </div>
        </section>

        {/* 위치 */}
        <section className="rd-section">
          <h2 className="rd-section__title">위치</h2>
          <div className="rd-map">
            <MapView restaurants={[restaurant]} pinnedIds={new Set(myPin ? [restaurant.id] : [])} />
          </div>
          <a href={directionsUrl} target="_blank" rel="noreferrer" className="rd-directions-btn">
            <Navigation size={15} strokeWidth={2.2} /> 카카오맵 길찾기
          </a>
        </section>

        {/* 내 핀 */}
        <section className="rd-section">
          <h2 className="rd-section__title">내 기록</h2>
          {myPin ? (
            <div className="rd-my-pin">
              <div className="rd-my-pin__head">
                <span className="rd-my-pin__stars">
                  {'★'.repeat(myPin.rating)}{'☆'.repeat(5 - myPin.rating)}
                </span>
                <button className="rd-my-pin__edit" onClick={() => setShowPinForm(true)}>
                  수정
                </button>
              </div>
              {myPin.memo && <p className="rd-my-pin__memo">{myPin.memo}</p>}
            </div>
          ) : (
            <button className="rd-pin-btn" onClick={() => setShowPinForm(true)}>
              📌 이 식당 핀하기
            </button>
          )}
        </section>

        {/* 다른 사람들의 기록 */}
        <section className="rd-section">
          <h2 className="rd-section__title">
            방문자 기록 <span className="rd-section__count">{otherPins.length}</span>
          </h2>
          {otherPins.length === 0 ? (
            <p className="rd-no-reviews">아직 다른 방문 기록이 없어요</p>
          ) : (
            <ul className="rd-review-list">
              {otherPins.map((p) => (
                <li key={p.id} className="rd-review">
                  <div className="rd-review__avatar">
                    {p.user.profileImage ? (
                      <img src={photoSrc(p.user.profileImage)} alt={p.user.nickname} />
                    ) : (
                      '👤'
                    )}
                  </div>
                  <div className="rd-review__body">
                    <div className="rd-review__head">
                      <span className="rd-review__nickname">{p.user.nickname}</span>
                      <span className="rd-review__stars">
                        {'★'.repeat(p.rating)}{'☆'.repeat(5 - p.rating)}
                      </span>
                    </div>
                    {p.memo && <p className="rd-review__memo">{p.memo}</p>}
                    <span className="rd-review__date">
                      {new Date(p.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {showPinForm && (
        <PinForm
          restaurant={restaurant}
          existingPin={myPin}
          onSave={handlePin}
          onUnpin={handleUnpin}
          onCancel={() => setShowPinForm(false)}
        />
      )}
    </div>
  );
}
