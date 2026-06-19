import { useState, useRef } from 'react';
import type { CreateRestaurantDto } from '../api/restaurants';
import { uploadImage } from '../api/restaurants';
import './AddPinForm.css';

const CATEGORIES = ['한식', '중식', '일식', '양식', '분식', '카페/디저트', '치킨/피자', '고기/구이', '해산물', '패스트푸드', '술집/포차'];

interface Props {
  latitude: number;
  longitude: number;
  address: string;
  onSave: (dto: CreateRestaurantDto) => void;
  onCancel: () => void;
}

export default function AddPinForm({ latitude, longitude, address, onSave, onCancel }: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setPhotoUrl(url);
    } catch {
      alert('사진 업로드 실패');
      setPhotoPreview('');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      latitude,
      longitude,
      address: address || undefined,
      photoUrl: photoUrl || undefined,
      category: category || undefined,
    });
  };

  return (
    <div className="pin-form-overlay">
      <div className="pin-form">
        <div className="pin-form__drag-bar" />
        <h2 className="pin-form__title">식당 추가</h2>
        {address && <p className="pin-form__address">📍 {address}</p>}

        <form onSubmit={handleSubmit}>
          <div className="pin-form__photo" onClick={() => fileRef.current?.click()}>
            {photoPreview ? (
              <img src={photoPreview} alt="preview" />
            ) : (
              <div className="pin-form__photo-placeholder">
                {uploading ? '업로드 중...' : '📷 사진 추가'}
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePhoto} />
          </div>

          <div className="pin-form__field">
            <label>식당 이름 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="식당 이름"
              maxLength={100}
              autoFocus
            />
          </div>

          <div className="pin-form__field">
            <label>카테고리</label>
            <div className="pin-form__categories">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`cat-chip ${category === cat ? 'cat-chip--active' : ''}`}
                  onClick={() => setCategory(category === cat ? '' : cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="pin-form__actions">
            <button type="button" className="btn btn--cancel" onClick={onCancel}>취소</button>
            <button type="submit" className="btn btn--save" disabled={!name.trim() || uploading}>추가</button>
          </div>
        </form>
      </div>
    </div>
  );
}
