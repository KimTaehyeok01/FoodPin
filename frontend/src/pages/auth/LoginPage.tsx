import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './LoginPage.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? '로그인 실패');
      localStorage.setItem('token', data.token);
      navigate('/', { replace: true });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h1 className="login-logo">FoodPin</h1>
        <p className="login-sub">나만의 맛집 지도</p>

        <form className="login-form" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <Link to="/register" className="login-signup-link">
          계정이 없으신가요? <strong>회원가입</strong>
        </Link>

        <div className="login-divider"><span>또는 소셜 로그인</span></div>

        <div className="social-buttons">
          <a href={`${API_URL}/auth/kakao`} className="btn-social btn-kakao">
            카카오로 시작하기
          </a>
          <a href={`${API_URL}/auth/naver`} className="btn-social btn-naver">
            네이버로 시작하기
          </a>
        </div>
      </div>
    </div>
  );
}
