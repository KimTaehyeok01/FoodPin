import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loadDaumPostcodeScript } from '../../utils/daumPostcode';
import './RegisterPage.css';

const API_URL = import.meta.env.VITE_API_URL;

const CATEGORIES = [
  '한식', '중식', '일식', '양식', '분식',
  '카페/디저트', '치킨/피자', '고기/구이', '해산물', '패스트푸드', '술집/포차',
];

const GENDER_OPTIONS: { value: string; label: string }[] = [
  { value: 'male', label: '남성' },
  { value: 'female', label: '여성' },
];

type Step = 1 | 2 | 3;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [postcodeOpen, setPostcodeOpen] = useState(false);
  const postcodeRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    nickname: '',
    address: '',
    age: '',
    gender: '',
    favoriteCategories: [] as string[],
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const toggleCategory = (cat: string) => {
    setForm((f) => ({
      ...f,
      favoriteCategories: f.favoriteCategories.includes(cat)
        ? f.favoriteCategories.filter((c) => c !== cat)
        : [...f.favoriteCategories, cat],
    }));
  };

  useEffect(() => {
    if (!postcodeOpen) return;
    loadDaumPostcodeScript()
      .then(() => {
        if (!postcodeRef.current) return;
        new daum.Postcode({
          oncomplete: (data) => {
            setForm((f) => ({ ...f, address: data.address }));
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

  const nextStep = async () => {
    setError('');

    if (step === 1) {
      if (!form.email || !form.password || !form.name || !form.nickname) {
        setError('이메일, 비밀번호, 이름, 닉네임은 필수입니다.');
        return;
      }
      if (form.password.length < 8) {
        setError('비밀번호는 8자 이상이어야 합니다.');
        return;
      }
      if (form.password !== form.passwordConfirm) {
        setError('비밀번호가 일치하지 않습니다.');
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/auth/check-email?email=${encodeURIComponent(form.email)}`);
        const data = await res.json();
        if (!data.available) {
          setError('이미 사용 중인 이메일입니다.');
          return;
        }
      } catch {
        setError('이메일 확인에 실패했습니다. 잠시 후 다시 시도해주세요.');
        return;
      } finally {
        setLoading(false);
      }
    }

    if (step === 2) {
      if (!form.address || !form.age || !form.gender) {
        setError('주소, 나이, 성별을 모두 입력해주세요.');
        return;
      }
    }

    setStep((s) => (s + 1) as Step);
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const body: any = {
        email: form.email,
        password: form.password,
        name: form.name,
        nickname: form.nickname,
        address: form.address,
        age: Number(form.age),
        gender: form.gender,
      };
      if (form.favoriteCategories.length > 0) body.favoriteCategories = form.favoriteCategories;

      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? '회원가입 실패');
      localStorage.setItem('token', data.token);
      navigate('/', { replace: true });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-box">
        <div className="register-header">
          {step > 1 && (
            <button className="register-back" onClick={() => setStep((s) => (s - 1) as Step)}>
              ←
            </button>
          )}
          <div className="register-progress">
            {[1, 2, 3].map((n) => (
              <div key={n} className={`progress-bar ${n <= step ? 'progress-bar--active' : ''}`} />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="register-step">
            <h2>기본 정보</h2>
            <p>계정을 만들어보세요</p>
            <div className="register-fields">
              <input type="email" placeholder="이메일 *" value={form.email} onChange={set('email')} />
              <input type="text" placeholder="이름 (실명) *" value={form.name} onChange={set('name')} maxLength={50} />
              <input type="text" placeholder="닉네임 (앱에서 사용할 이름) *" value={form.nickname} onChange={set('nickname')} maxLength={50} />
              <input type="password" placeholder="비밀번호 (8자 이상) *" value={form.password} onChange={set('password')} />
              <input type="password" placeholder="비밀번호 확인 *" value={form.passwordConfirm} onChange={set('passwordConfirm')} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="register-step">
            <h2>추가 정보</h2>
            <p>정확한 서비스 이용을 위해 모두 입력해주세요</p>
            <div className="register-fields">
              <div className="field-group">
                <span className="field-label">주소 *</span>
                <button type="button" className="address-search-btn" onClick={() => setPostcodeOpen(true)}>
                  {form.address || '주소 검색하기'}
                </button>
              </div>

              <div className="field-group">
                <span className="field-label">나이 *</span>
                <input type="number" placeholder="나이" value={form.age} onChange={set('age')} min={1} max={120} />
              </div>

              <div className="field-group">
                <span className="field-label">성별 *</span>
                <div className="category-grid">
                  {GENDER_OPTIONS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      className={`category-chip ${form.gender === g.value ? 'category-chip--active' : ''}`}
                      onClick={() => setForm((f) => ({ ...f, gender: g.value }))}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="register-step">
            <h2>선호 음식</h2>
            <p>좋아하는 카테고리를 골라주세요</p>
            <div className="category-grid">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`category-chip ${form.favoriteCategories.includes(cat) ? 'category-chip--active' : ''}`}
                  onClick={() => toggleCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <p className="register-error">{error}</p>}

        <div className="register-actions">
          {step < 3 ? (
            <button className="btn-primary" onClick={nextStep} disabled={loading}>
              {loading ? '확인 중...' : '다음'}
            </button>
          ) : (
            <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? '가입 중...' : '가입 완료'}
            </button>
          )}
          {step === 3 && (
            <button className="btn-skip" onClick={handleSubmit} disabled={loading}>
              건너뛰고 시작하기
            </button>
          )}
        </div>

        {step === 1 && (
          <Link to="/login" className="register-login-link">
            이미 계정이 있으신가요? <strong>로그인</strong>
          </Link>
        )}
      </div>

      {postcodeOpen && (
        <div className="postcode-overlay" onClick={() => setPostcodeOpen(false)}>
          <div className="postcode-modal" onClick={(e) => e.stopPropagation()}>
            <div className="postcode-modal__header">
              <span>주소 검색</span>
              <button className="postcode-modal__close" onClick={() => setPostcodeOpen(false)} aria-label="닫기">✕</button>
            </div>
            <div ref={postcodeRef} className="postcode-modal__body" />
          </div>
        </div>
      )}
    </div>
  );
}
