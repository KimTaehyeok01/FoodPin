import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './RegisterPage.css';

const API_URL = import.meta.env.VITE_API_URL;

const CATEGORIES = [
  '한식', '중식', '일식', '양식', '분식',
  '카페/디저트', '치킨/피자', '고기/구이', '해산물', '패스트푸드', '술집/포차',
];

type Step = 1 | 2 | 3;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    nickname: '',
    address: '',
    age: '',
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

  const nextStep = () => {
    setError('');
    if (step === 1) {
      if (!form.email || !form.password || !form.nickname) {
        setError('이메일, 비밀번호, 닉네임은 필수입니다.');
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
        nickname: form.nickname,
      };
      if (form.address) body.address = form.address;
      if (form.age) body.age = Number(form.age);
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
              <input type="text" placeholder="닉네임 *" value={form.nickname} onChange={set('nickname')} maxLength={50} />
              <input type="password" placeholder="비밀번호 (8자 이상) *" value={form.password} onChange={set('password')} />
              <input type="password" placeholder="비밀번호 확인 *" value={form.passwordConfirm} onChange={set('passwordConfirm')} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="register-step">
            <h2>추가 정보</h2>
            <p>선택 사항이에요</p>
            <div className="register-fields">
              <input type="text" placeholder="주소 (예: 서울 강남구)" value={form.address} onChange={set('address')} />
              <input type="number" placeholder="나이" value={form.age} onChange={set('age')} min={1} max={120} />
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
            <button className="btn-primary" onClick={nextStep}>다음</button>
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
    </div>
  );
}
