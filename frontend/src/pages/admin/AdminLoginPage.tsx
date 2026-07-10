// 관리자 로그인 페이지 — 이메일+비밀번호만 지원 (소셜 로그인 없음)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAuthApi } from '../../api/admin';
import './AdminLoginPage.css';

export default function AdminLoginPage() {
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
      const { token } = await adminAuthApi.login({ email, password });
      localStorage.setItem('admin_token', token);
      navigate('/admin', { replace: true });
    } catch (e: any) {
      setError(e.message ?? '로그인 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-box">
        <h1 className="admin-login-logo">FoodPin</h1>
        <p className="admin-login-sub">관리자 로그인</p>

        <form className="admin-login-form" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="관리자 이메일"
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
          {error && <p className="admin-login-error">{error}</p>}
          <button type="submit" className="admin-login-submit" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}
