// 관리자 페이지 공통 레이아웃 — 상단 헤더 + 탭 네비게이션
import { NavLink, useNavigate } from 'react-router-dom';
import './AdminLayout.css';

const TABS = [
  { to: '/admin', label: '대시보드', end: true },
  { to: '/admin/users', label: '회원관리', end: false },
  { to: '/admin/restaurants', label: '식당관리', end: false },
  { to: '/admin/pins', label: '리뷰관리', end: false },
  { to: '/admin/inquiries', label: '문의관리', end: false },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="admin-layout">
      <header className="admin-layout__header">
        <span className="admin-layout__title">FoodPin 관리자</span>
        <button className="admin-layout__logout" onClick={handleLogout}>로그아웃</button>
      </header>
      <nav className="admin-layout__nav">
        {TABS.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              'admin-layout__tab' + (isActive ? ' admin-layout__tab--active' : '')
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <main className="admin-layout__body">{children}</main>
    </div>
  );
}
