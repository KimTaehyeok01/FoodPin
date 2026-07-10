// 관리자 대시보드 — 회원관리/앱관리 기능은 다음 단계에서 추가 예정
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAuthApi } from '../../api/admin';
import type { AdminProfile } from '../../api/admin';
import './AdminDashboardPage.css';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<AdminProfile | null>(null);

  useEffect(() => {
    adminAuthApi.getMe().catch(() => {
      localStorage.removeItem('admin_token');
      navigate('/admin/login', { replace: true });
    }).then((me) => me && setAdmin(me));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="admin-dash-page">
      <header className="admin-dash-header">
        <span className="admin-dash-title">FoodPin 관리자</span>
        <button className="admin-dash-logout" onClick={handleLogout}>로그아웃</button>
      </header>
      <div className="admin-dash-body">
        <p>{admin ? `${admin.nickname}님, 환영합니다.` : '확인 중...'}</p>
        <p className="admin-dash-notice">회원관리·앱관리 기능은 준비 중입니다.</p>
      </div>
    </div>
  );
}
