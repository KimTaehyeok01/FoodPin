// 프로필 정보 변경 페이지 — 닉네임·주소·나이·프로필 사진 수정
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Camera } from 'lucide-react';
import { usersApi, uploadImage, photoSrc } from '../../api/restaurants';
import './ProfileEditPage.css';

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const [isLeaving, setIsLeaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nickname, setNickname] = useState('');
  const [address, setAddress] = useState('');
  const [age, setAge] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    usersApi.getMe()
      .then((me) => {
        setNickname(me.nickname);
        setAddress(me.address ?? '');
        setAge(me.age != null ? String(me.age) : '');
        setProfileImage(me.profileImage);
        setEmail(me.email);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
    const parsedAge = age.trim() ? Number(age) : undefined;
    if (parsedAge !== undefined && (!Number.isInteger(parsedAge) || parsedAge < 1 || parsedAge > 120)) {
      alert('나이는 1~120 사이의 숫자로 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      await usersApi.updateProfile({
        nickname: trimmed,
        address: address.trim() || undefined,
        age: parsedAge,
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

            <label className="pe-field">
              <span className="pe-field__label">나이</span>
              <input
                className="pe-field__input"
                value={age}
                inputMode="numeric"
                placeholder="예: 25"
                onChange={(e) => setAge(e.target.value.replace(/\D/g, ''))}
              />
            </label>

            <button className="pe-save" onClick={handleSave} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
