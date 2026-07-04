// 식당 상세 페이지 — 피그마 디자인 기반 (히어로 + 정보 시트 + 메뉴/사진/리뷰 탭)
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Share2,
  Heart,
  MapPin,
  Phone,
  Clock,
  Pencil,
} from 'lucide-react';
import { restaurantsApi, pinsApi, photoSrc } from '../api/restaurants';
import type { Restaurant, Pin, RestaurantPin, CreatePinDto } from '../api/restaurants';
import PinForm from '../components/PinForm';
import './RestaurantDetailPage.css';

type Tab = 'menu' | 'photo' | 'review';

// 두 좌표 사이 거리(km) — 하버사인 공식
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function priceLevel(menus: { price: number }[]): string {
  if (menus.length === 0) return '';
  const avg = menus.reduce((s, m) => s + m.price, 0) / menus.length;
  if (avg < 8000) return '₩';
  if (avg < 15000) return '₩₩';
  return '₩₩₩';
}

export default function RestaurantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const restaurantId = Number(id);

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [pins, setPins] = useState<RestaurantPin[]>([]);
  const [myPins, setMyPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPinForm, setShowPinForm] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('menu');
  const [distance, setDistance] = useState<number | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);

  // 뒤로가기: 나가는 슬라이드 애니메이션 재생 후 실제 이동
  const handleBack = () => setIsLeaving(true);

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

  useEffect(() => {
    if (!restaurant || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDistance(
          distanceKm(
            pos.coords.latitude,
            pos.coords.longitude,
            Number(restaurant.latitude),
            Number(restaurant.longitude),
          ),
        );
      },
      () => {}, // 위치 거부 시 거리 표시 생략
    );
  }, [restaurant]);

  const myPin = myPins.find((p) => p.restaurantId === restaurantId);
  const otherPins = pins.filter((p) => p.id !== myPin?.id);
  const avgRating =
    pins.length > 0
      ? (pins.reduce((sum, p) => sum + p.rating, 0) / pins.length).toFixed(1)
      : null;
  const menus = restaurant?.menus ?? [];

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
      alert('저장에 실패했습니다.');
    }
  };

  const handleUnpin = async () => {
    try {
      await pinsApi.unpin(restaurantId);
      setMyPins((prev) => prev.filter((p) => p.restaurantId !== restaurantId));
      setShowPinForm(false);
      refreshPins();
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: restaurant?.name, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      alert('링크가 복사되었습니다.');
    }
  };

  if (loading) {
    return (
      <div className="rdx">
        <div className="rdx-skeleton" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="rdx">
        <div className="rdx-empty">
          <p>🍽️</p>
          <p>식당을 찾을 수 없어요</p>
          <button className="rdx-empty__back" onClick={() => navigate(-1)}>돌아가기</button>
        </div>
      </div>
    );
  }

  const directionsUrl = `https://map.kakao.com/link/to/${encodeURIComponent(
    restaurant.name,
  )},${restaurant.latitude},${restaurant.longitude}`;

  return (
    <div
      className={`rdx${isLeaving ? ' rdx--leaving' : ''}`}
      onAnimationEnd={() => { if (isLeaving) navigate(-1); }}
    >
      <div className="rdx-layout">
        {/* 히어로 */}
        <div className="rdx-hero">
          {restaurant.photoUrl ? (
            <img src={photoSrc(restaurant.photoUrl)} alt={restaurant.name} className="rdx-hero__img" />
          ) : (
            <div className="rdx-hero__no-img">🍽️</div>
          )}
          <button className="rdx-hero__back" onClick={handleBack} aria-label="뒤로가기">
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="rdx-hero__actions">
            <button onClick={handleShare} aria-label="공유">
              <Share2 size={17} strokeWidth={2} />
            </button>
            <button
              className={myPin ? 'rdx-heart--active' : ''}
              onClick={() => setShowPinForm(true)}
              aria-label="핀"
            >
              <Heart size={17} strokeWidth={2} fill={myPin ? '#ff6b35' : 'none'} />
            </button>
          </div>
        </div>

        {/* 정보 시트 — PC에서는 head/aside/content 3영역 그리드로 재배치 */}
        <div className="rdx-sheet">
          <div className="rdx-head">
          <div className="rdx-top">
            <div className="rdx-chips">
              {restaurant.category && <span className="rdx-chip rdx-chip--cat">{restaurant.category}</span>}
              {priceLevel(menus) && <span className="rdx-chip rdx-chip--price">{priceLevel(menus)}</span>}
            </div>
            <div className="rdx-rating">
              <span className="rdx-rating__score">
                <span className="rdx-rating__star">★</span> {avgRating ?? '-'}
              </span>
              <span className="rdx-rating__count">리뷰 {pins.length}개</span>
            </div>
          </div>

          <h1 className="rdx-name">{restaurant.name}</h1>
          </div>

          <aside className="rdx-aside">
          <div className="rdx-rows">
            {restaurant.address && (
              <div className="rdx-row">
                <MapPin size={15} strokeWidth={2.2} className="rdx-row__icon rdx-row__icon--orange" />
                <span className="rdx-row__text">{restaurant.address}</span>
                {distance !== null && (
                  <span className="rdx-distance">
                    {distance < 10 ? distance.toFixed(1) : Math.round(distance)}km
                  </span>
                )}
              </div>
            )}
            {restaurant.phone && (
              <div className="rdx-row">
                <Phone size={15} strokeWidth={2.2} className="rdx-row__icon rdx-row__icon--blue" />
                <span className="rdx-row__text">{restaurant.phone}</span>
              </div>
            )}
            {(restaurant.hoursWeekday || restaurant.hoursWeekend) && (
              <div className="rdx-row rdx-row--hours">
                <Clock size={15} strokeWidth={2.2} className="rdx-row__icon rdx-row__icon--green" />
                <div className="rdx-hours">
                  {restaurant.hoursWeekday && (
                    <p><b>월–금</b> {restaurant.hoursWeekday}</p>
                  )}
                  {restaurant.hoursWeekend && (
                    <p><b>토–일</b> {restaurant.hoursWeekend}</p>
                  )}
                  {restaurant.breakTime && (
                    <p className="rdx-hours__break"><b>브레이크</b> {restaurant.breakTime}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {restaurant.description && <p className="rdx-desc">{restaurant.description}</p>}

          <div className="rdx-actions">
            <a href={directionsUrl} target="_blank" rel="noreferrer" className="rdx-btn rdx-btn--dark">
              <MapPin size={15} strokeWidth={2.2} /> 길찾기
            </a>
            {restaurant.phone && (
              <a href={`tel:${restaurant.phone}`} className="rdx-btn rdx-btn--orange">
                <Phone size={15} strokeWidth={2.2} /> 전화하기
              </a>
            )}
          </div>

          {/* 리뷰 작성 버튼 — 모바일: 플로팅 / PC: 사이드 카드 하단 */}
          <button className="rdx-cta" onClick={() => setShowPinForm(true)}>
            <Pencil size={16} strokeWidth={2.2} /> 리뷰 작성하기
          </button>
          </aside>

          <div className="rdx-content">
          {/* 탭 */}
          <div className="rdx-tabs">
            <button
              className={`rdx-tab ${activeTab === 'menu' ? 'rdx-tab--active' : ''}`}
              onClick={() => setActiveTab('menu')}
            >
              메뉴
            </button>
            <button
              className={`rdx-tab ${activeTab === 'photo' ? 'rdx-tab--active' : ''}`}
              onClick={() => setActiveTab('photo')}
            >
              사진
            </button>
            <button
              className={`rdx-tab ${activeTab === 'review' ? 'rdx-tab--active' : ''}`}
              onClick={() => setActiveTab('review')}
            >
              리뷰
            </button>
          </div>

          {/* 탭 콘텐츠 */}
          {activeTab === 'menu' && (
            <div className="rdx-menu-list">
              {menus.length === 0 ? (
                <p className="rdx-tab-empty">등록된 메뉴가 없어요</p>
              ) : (
                menus.map((m) => (
                  <div key={m.id} className="rdx-menu">
                    <div className="rdx-menu__emoji">{m.emoji ?? '🍽️'}</div>
                    <div className="rdx-menu__body">
                      <p className="rdx-menu__name">{m.name}</p>
                      {m.isPopular && <span className="rdx-menu__popular">🔥 인기 메뉴</span>}
                    </div>
                    <span className="rdx-menu__price">{m.price.toLocaleString()}원</span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'photo' && (
            <div className="rdx-photo-grid">
              {restaurant.photoUrl ? (
                <img src={photoSrc(restaurant.photoUrl)} alt={restaurant.name} />
              ) : (
                <p className="rdx-tab-empty">등록된 사진이 없어요</p>
              )}
            </div>
          )}

          {activeTab === 'review' && (
            <div className="rdx-review-area">
              {myPin && (
                <div className="rdx-my-review">
                  <div className="rdx-my-review__head">
                    <span className="rdx-my-review__label">내 리뷰</span>
                    <span className="rdx-my-review__stars">
                      {'★'.repeat(myPin.rating)}{'☆'.repeat(5 - myPin.rating)}
                    </span>
                    <button className="rdx-my-review__edit" onClick={() => setShowPinForm(true)}>
                      수정
                    </button>
                  </div>
                  {myPin.memo && <p className="rdx-my-review__memo">{myPin.memo}</p>}
                </div>
              )}
              {otherPins.length === 0 && !myPin ? (
                <p className="rdx-tab-empty">아직 리뷰가 없어요. 첫 리뷰를 남겨보세요!</p>
              ) : (
                <ul className="rdx-review-list">
                  {otherPins.map((p) => (
                    <li key={p.id} className="rdx-review">
                      <div className="rdx-review__avatar">
                        {p.user.profileImage ? (
                          <img src={photoSrc(p.user.profileImage)} alt={p.user.nickname} />
                        ) : (
                          '👤'
                        )}
                      </div>
                      <div className="rdx-review__body">
                        <div className="rdx-review__head">
                          <span className="rdx-review__nickname">{p.user.nickname}</span>
                          <span className="rdx-review__stars">
                            {'★'.repeat(p.rating)}{'☆'.repeat(5 - p.rating)}
                          </span>
                        </div>
                        {p.memo && <p className="rdx-review__memo">{p.memo}</p>}
                        <span className="rdx-review__date">
                          {new Date(p.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          </div>
        </div>
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
