// 프로필 정보 변경 페이지 — 닉네임·주소·선호 음식 카테고리·프로필 사진 수정
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Camera } from 'lucide-react';
import { usersApi, uploadImage, photoSrc } from '../../api/restaurants';
import './ProfileEditPage.css';

const CATEGORIES = [
  '한식', '중식', '일식', '양식', '분식',
  '카페/디저트', '치킨/피자', '고기/구이', '해산물', '패스트푸드', '술집/포차',
];

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const [isLeaving, setIsLeaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nickname, setNickname] = useState('');
  const [address, setAddress] = useState('');
  const [favoriteCategories, setFavoriteCategories] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    usersApi.getMe()
      .then((me) => {
        setNickname(me.nickname);
        setAddress(me.address ?? '');
        setFavoriteCategories(me.favoriteCategories);
        setProfileImage(me.profileImage);
        setEmail(me.email);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleCategory = (cat: string) => {
    setFavoriteCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImage(file);
      setProfileImage(url);
    } catch {
      alert('이미지 업로드에 실패했습니다.');
    }
  };

  const handleSave = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      alert('닉네임을 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      await usersApi.updateProfile({
        nickname: trimmed,
        address: address.trim() || undefined,
        favoriteCategories,
        profileImage: profileImage ?? undefined,
      });
      setIsLeaving(true);
    } catch {
      alert('프로필 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`pe-page${isLeaving ? ' pe-page--leaving' : ''}`}
      onAnimationEnd={(e) => { if (isLeaving && e.target === e.currentTarget) navigate(-1); }}
    >
      <header className="pe-header">
        <button className="pe-back" onClick={() => setIsLeaving(true)} aria-label="뒤로가기">
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>
        <h1 className="pe-title">프로필 정보 변경</h1>
      </header>

      <div className="pe-body">
        {loading ? (
          <div className="pe-skeleton" />
        ) : (
          <div className="pe-card">
            {/* 프로필 사진 */}
            <div className="pe-avatar-wrap">
              <button className="pe-avatar" onClick={() => fileInputRef.current?.click()}>
                {profileImage ? (
                  <img src={photoSrc(profileImage)} alt="프로필" />
                ) : (
                  <span className="pe-avatar__placeholder">👤</span>
                )}
                <span className="pe-avatar__camera">
                  <Camera size={14} strokeWidth={2} />
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
              {email && <p className="pe-email">{email}</p>}
            </div>

            {/* 입력 필드 */}
            <label className="pe-field">
              <span className="pe-field__label">닉네임</span>
              <input
                className="pe-field__input"
                value={nickname}
                maxLength={50}
                placeholder="닉네임"
                onChange={(e) => setNickname(e.target.value)}
              />
            </label>

            <label className="pe-field">
              <span className="pe-field__label">주소</span>
              <input
                className="pe-field__input"
                value={address}
                maxLength={255}
                placeholder="예: 서울 노원구"
                onChange={(e) => setAddress(e.target.value)}
              />
            </label>

            <div className="pe-field">
              <span className="pe-field__label">선호 음식</span>
              <div className="pe-chip-grid">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`pe-chip ${favoriteCategories.includes(cat) ? 'pe-chip--active' : ''}`}
                    onClick={() => toggleCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <button className="pe-save" onClick={handleSave} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
