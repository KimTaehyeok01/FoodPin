// 관리자 대시보드 — 요약 통계
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import type { AdminStats } from '../../api/admin';
import AdminLayout from './AdminLayout';
import './AdminDashboardPage.css';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    adminApi.getStats().then(setStats).catch(() => {
      localStorage.removeItem('admin_token');
      navigate('/admin/login', { replace: true });
    });
  }, []);

  return (
    <AdminLayout>
      <div className="admin-dash-grid">
        <div className="admin-dash-card">
          <span className="admin-dash-card__label">전체 회원</span>
          <span className="admin-dash-card__value">{stats?.userCount ?? '-'}</span>
        </div>
        <div className="admin-dash-card">
          <span className="admin-dash-card__label">등록된 식당</span>
          <span className="admin-dash-card__value">{stats?.restaurantCount ?? '-'}</span>
        </div>
        <div className="admin-dash-card">
          <span className="admin-dash-card__label">미답변 문의</span>
          <span className="admin-dash-card__value">{stats?.pendingInquiryCount ?? '-'}</span>
        </div>
      </div>
    </AdminLayout>
  );
}
