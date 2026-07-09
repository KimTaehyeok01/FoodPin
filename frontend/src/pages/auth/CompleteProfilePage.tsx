// 소셜 로그인 유저의 부족한 정보(이름·주소·나이·성별)를 채우는 필수 입력 페이지
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../../api/restaurants';
import { loadDaumPostcodeScript } from '../../utils/daumPostcode';
import './CompleteProfilePage.css';

const CATEGORIES = [
  '한식', '중식', '일식', '양식', '분식',
  '카페/디저트', '치킨/피자', '고기/구이', '해산물', '패스트푸드', '술집/포차',
];

const GENDER_OPTIONS: { value: string; label: string }[] = [
  { value: 'male', label: '남성' },
  { value: 'female', label: '여성' },
];

export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [postcodeOpen, setPostcodeOpen] = useState(false);
  const postcodeRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [address, setAddress] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [favoriteCategories, setFavoriteCategories] = useState<string[]>([]);

  // 카카오/네이버 프로필의 닉네임을 기본값으로 채워서, 그 자리에서 바로 수정할 수 있게 한다
  useEffect(() => {
    usersApi.getMe()
      .then((me) => setNickname(me.nickname))
      .catch(() => {})
      .finally(() => setInitialLoading(false));
  }, []);

  const toggleCategory = (cat: string) => {
    setFavoriteCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  useEffect(() => {
    if (!postcodeOpen) return;
    loadDaumPostcodeScript()
      .then(() => {
        if (!postcodeRef.current) return;
        new daum.Postcode({
          oncomplete: (data) => {
            setAddress(data.address);
            setPostcodeOpen(false);
          },
          width: '100%',
          height: '100%',
        }).embed(postcodeRef.current);
      })
      .catch(() => {
        alert('주소 검색을 불러오지 못했습니다.');
        setPostcodeOpen(false);
      });
  }, [postcodeOpen]);

  const handleSubmit = async () => {
    setError('');
    if (!name.trim() || !nickname.trim() || !address || !age || !gender) {
      setError('이름, 닉네임, 주소, 나이, 성별을 모두 입력해주세요.');
      return;
    }
    const parsedAge = Number(age);
    if (!Number.isInteger(parsedAge) || parsedAge < 1 || parsedAge > 120) {
      setError('나이는 1~120 사이의 숫자로 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      await usersApi.updateProfile({
        name: name.trim(),
        nickname: nickname.trim(),
        address,
        age: parsedAge,
        gender,
        favoriteCategories: favoriteCategories.length > 0 ? favoriteCategories : undefined,
      });
      navigate('/', { replace: true });
    } catch {
      setError('저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="cp-page">
        <p className="cp-loading">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="cp-page">
      <div className="cp-box">
        <h2>프로필을 완성해주세요</h2>
        <p>서비스 이용을 위해 추가 정보가 필요해요</p>

        <div className="cp-fields">
          <input type="text" placeholder="이름 (실명) *" value={name} onChange={(e) => setName(e.target.value)} maxLength={50} />
          <input type="text" placeholder="닉네임 (앱에서 사용할 이름) *" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={50} />

          <div className="cp-field-group">
            <span className="cp-field-label">주소 *</span>
            <button type="button" className="cp-address-btn" onClick={() => setPostcodeOpen(true)}>
              {address || '주소 검색하기'}
            </button>
          </div>

          <div className="cp-field-group">
            <span className="cp-field-label">나이 *</span>
            <input type="number" placeholder="나이" value={age} onChange={(e) => setAge(e.target.value)} min={1} max={120} />
          </div>

          <div className="cp-field-group">
            <span className="cp-field-label">성별 *</span>
            <div className="cp-chip-grid">
              {GENDER_OPTIONS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  className={`cp-chip ${gender === g.value ? 'cp-chip--active' : ''}`}
                  onClick={() => setGender(g.value)}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div className="cp-field-group">
            <span className="cp-field-label">선호 음식 (선택)</span>
            <div className="cp-chip-grid">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`cp-chip ${favoriteCategories.includes(cat) ? 'cp-chip--active' : ''}`}
                  onClick={() => toggleCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="cp-error">{error}</p>}

        <button className="cp-submit" onClick={handleSubmit} disabled={loading}>
          {loading ? '저장 중...' : '완료하고 시작하기'}
        </button>
      </div>

      {postcodeOpen && (
        <div className="cp-postcode-overlay" onClick={() => setPostcodeOpen(false)}>
          <div className="cp-postcode-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cp-postcode-modal__header">
              <span>주소 검색</span>
              <button className="cp-postcode-modal__close" onClick={() => setPostcodeOpen(false)} aria-label="닫기">✕</button>
            </div>
            <div ref={postcodeRef} className="cp-postcode-modal__body" />
          </div>
        </div>
      )}
    </div>
  );
}
