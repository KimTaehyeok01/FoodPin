import { Bookmark } from 'lucide-react';
import { photoSrc } from '../api/restaurants';
import type { Restaurant, Pin } from '../api/restaurants';
import './RestaurantCard.css';

interface Props {
  restaurant: Restaurant;
  pinned?: boolean;
  myPin?: Pin;
  hot?: boolean;
}

export default function RestaurantCard({ restaurant, pinned, myPin, hot }: Props) {
  const rating = myPin?.rating ?? 0;

  return (
    <div className="rc">
      <div className="rc__img-wrap">
        {restaurant.photoUrl ? (
          <img src={photoSrc(restaurant.photoUrl)} alt={restaurant.name} className="rc__img" />
        ) : (
          <div className="rc__no-img">🍽️</div>
        )}
        {restaurant.category && (
          <span className="rc__badge">{restaurant.category}</span>
        )}
        <button className={`rc__pin-btn ${pinned ? 'rc__pin-btn--active' : ''}`} aria-label="핀">
          <Bookmark size={14} strokeWidth={2} fill={pinned ? '#ff6b35' : 'none'} />
        </button>
        {hot && <span className="rc__hot-badge">🔥 HOT</span>}
      </div>

      <div className="rc__body">
        <p className="rc__name">{restaurant.name}</p>
        {restaurant.address && (
          <p className="rc__addr">📍 {restaurant.address}</p>
        )}
        <div className="rc__meta">
          {rating > 0 ? (
            <span className="rc__stars">⭐ {rating}.0</span>
          ) : (
            <span className="rc__stars rc__stars--empty">⭐ -</span>
          )}
          {myPin && <span className="rc__pinned-label">핀함</span>}
        </div>
      </div>
    </div>
  );
}
