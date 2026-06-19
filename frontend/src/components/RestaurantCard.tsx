import { MapPin } from 'lucide-react';
import type { Restaurant, Pin } from '../api/restaurants';
import './RestaurantCard.css';

const API_URL = import.meta.env.VITE_API_URL;

interface Props {
  restaurant: Restaurant;
  pinned?: boolean;
  myPin?: Pin;
}

export default function RestaurantCard({ restaurant, pinned, myPin }: Props) {
  const rating = myPin?.rating ?? 0;

  return (
    <div className="rc">
      <div className="rc__img-wrap">
        {restaurant.photoUrl ? (
          <img src={`${API_URL}${restaurant.photoUrl}`} alt={restaurant.name} className="rc__img" />
        ) : (
          <div className="rc__no-img">🍽️</div>
        )}
        {restaurant.category && (
          <span className="rc__badge">{restaurant.category}</span>
        )}
        {pinned && (
          <span className="rc__pinned-dot" />
        )}
      </div>

      <div className="rc__body">
        <p className="rc__name">{restaurant.name}</p>
        {myPin && (
          <p className="rc__stars">
            {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
          </p>
        )}
        {restaurant.address && (
          <p className="rc__addr">
            <MapPin size={10} strokeWidth={2} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />
            {restaurant.address}
          </p>
        )}
        {myPin?.memo && <p className="rc__memo">{myPin.memo}</p>}
      </div>
    </div>
  );
}
