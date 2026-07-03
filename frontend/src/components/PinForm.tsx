import { useState } from 'react';
import { photoSrc } from '../api/restaurants';
import type { Restaurant, Pin, CreatePinDto } from '../api/restaurants';
import './PinForm.css';

interface Props {
  restaurant: Restaurant;
  existingPin?: Pin;
  onSave: (dto: CreatePinDto) => void;
  onUnpin: () => void;
  onCancel: () => void;
}

export default function PinForm({ restaurant, existingPin, onSave, onUnpin, onCancel }: Props) {
  const [rating, setRating] = useState(existingPin?.rating ?? 3);
  const [memo, setMemo] = useState(existingPin?.memo ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ rating, memo: memo || undefined });
  };

  return (
    <div className="pin-form-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="pin-form">
        <div className="pin-form__drag-bar" />

        <div className="pin-form__restaurant-info">
          {restaurant.photoUrl ? (
            <img
              src={photoSrc(restaurant.photoUrl)}
              alt={restaurant.name}
              className="pin-form__restaurant-photo"
            />
          ) : (
            <div className="pin-form__restaurant-no-photo">🍽️</div>
          )}
          <div>
            <h2 className="pin-form__title">{restaurant.name}</h2>
            {restaurant.category && (
              <span className="pin-form__category">{restaurant.category}</span>
            )}
            {restaurant.address && (
              <p className="pin-form__address">📍 {restaurant.address}</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="pin-form__field">
            <label>별점</label>
            <div className="pin-form__stars">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`star ${n <= rating ? 'star--active' : ''}`}
                  onClick={() => setRating(n)}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="pin-form__field">
            <label>메모</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="맛, 분위기, 추천 메뉴 등"
              rows={3}
            />
          </div>

          <div className="pin-form__actions">
            {existingPin ? (
              <>
                <button type="button" className="btn btn--unpin" onClick={onUnpin}>핀 삭제</button>
                <button type="submit" className="btn btn--save">수정</button>
              </>
            ) : (
              <>
                <button type="button" className="btn btn--cancel" onClick={onCancel}>취소</button>
                <button type="submit" className="btn btn--save">핀 추가</button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
