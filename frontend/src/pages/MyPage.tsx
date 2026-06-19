import { useNavigate } from 'react-router-dom';
import './MyPage.css';

function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

const CATEGORIES = ['한식', '중식', '일식', '양식', '분식', '카페/디저트', '치킨/피자', '고기/구이', '해산물', '패스트푸드', '술집/포차'];

export default function MyPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const payload = token ? parseJwt(token) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  return (
    <div className="my-page">
      <header className="my-header">
        <h1>마이페이지</h1>
      </header>

      <div className="my-profile">
        <div className="my-avatar">👤</div>
        <p className="my-user-id">ID: {payload?.sub ?? '-'}</p>
      </div>

      <div className="my-section">
        <h3>앱 정보</h3>
        <div className="my-item">버전 1.0.0</div>
      </div>

      <div className="my-section">
        <button className="my-logout" onClick={handleLogout}>
          로그아웃
        </button>
      </div>
    </div>
  );
}
