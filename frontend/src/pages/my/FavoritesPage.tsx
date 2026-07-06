// 찜한 맛집 목록 페이지 — 가로형 카드 리스트 (별점·거리·찜 해제)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Star, Trash2 } from 'lucide-react';
import { pinsApi, photoSrc } from '../../api/restaurants';
import type { Pin } from '../../api/restaurants';
import { haversineKm } from '../../utils/distance';
import './FavoritesPage.css';

export default function FavoritesPage() {
  const navigate = useNavigate();
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleBack = () => setIsLeaving(true);

  useEffect(() => {
    pinsApi.getMyPins()
      .then(setPins)
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

  const handleUnpin = async (restaurantId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('찜을 해제할까요?')) return;
    try {
      await pinsApi.unpin(restaurantId);
      setPins((prev) => prev.filter((p) => p.restaurantId !== restaurantId));
    } catch {
      alert('찜 해제에 실패했습니다.');
    }
  };

  return (
    <div
      className={`fav-page${isLeaving ? ' fav-page--leaving' : ''}`}
      onAnimationEnd={(e) => { if (isLeaving && e.target === e.currentTarget) navigate(-1); }}
    >
      <header className="fav-header">
        <button className="fav-back" onClick={handleBack} aria-label="뒤로가기">
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>
        <div>
          <h1 className="fav-title">찜한 맛집</h1>
          <p className="fav-subtitle">{pins.length}개의 맛집</p>
        </div>
      </header>

      <div className="fav-body">
        {loading ? (
          <div className="fav-list">
            {[...Array(3)].map((_, i) => <div key={i} className="fav-skeleton" />)}
          </div>
        ) : pins.length === 0 ? (
          <div className="fav-empty">
            <p>💔</p>
            <p>아직 찜한 맛집이 없어요</p>
            <p className="fav-empty__sub">마음에 드는 맛집을 핀해보세요</p>
          </div>
        ) : (
          <div className="fav-list">
            {pins.map((p) => {
              const r = p.restaurant;
              const distance = userLocation
                ? haversineKm(userLocation.lat, userLocation.lng, Number(r.latitude), Number(r.longitude))
                : null;
              return (
                <div key={p.id} className="fav-card" onClick={() => navigate(`/restaurants/${r.id}`)}>
                  <div className="fav-card__img-wrap">
                    {r.photoUrl ? (
                      <img src={photoSrc(r.photoUrl)} alt={r.name} className="fav-card__img" />
                    ) : (
                      <div className="fav-card__no-img">🍽️</div>
                    )}
                    {p.rating >= 4 && <span className="fav-card__hot">🔥 HOT</span>}
                  </div>

                  <div className="fav-card__body">
                    <div className="fav-card__top">
                      {r.category && <span className="fav-card__category">{r.category}</span>}
                      <button
                        className="fav-card__delete"
                        onClick={(e) => handleUnpin(r.id, e)}
                        aria-label="찜 해제"
                      >
                        <Trash2 size={15} strokeWidth={2} />
                      </button>
                    </div>
                    <p className="fav-card__name">{r.name}</p>
                    {r.address && (
                      <p className="fav-card__addr">
                        <MapPin size={12} strokeWidth={2} /> {r.address}
                      </p>
                    )}
                    <div className="fav-card__meta">
                      <span className="fav-card__rating">
                        <Star size={13} strokeWidth={2} fill="#ffb800" color="#ffb800" /> {p.rating}.0
                      </span>
                      {distance !== null && (
                        <span className="fav-card__distance">
                          {distance < 10 ? distance.toFixed(1) : Math.round(distance)}km
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
