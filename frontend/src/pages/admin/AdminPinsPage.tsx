// 관리자 - 리뷰관리: 부적절한 리뷰(핀) 삭제
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import type { AdminPin } from '../../api/admin';
import AdminLayout from './AdminLayout';
import './AdminTable.css';

export default function AdminPinsPage() {
  const navigate = useNavigate();
  const [pins, setPins] = useState<AdminPin[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminApi.getPins()
      .then(setPins)
      .catch(() => {
        localStorage.removeItem('admin_token');
        navigate('/admin/login', { replace: true });
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (p: AdminPin) => {
    if (!confirm('이 리뷰를 삭제하시겠습니까?')) return;
    await adminApi.deletePin(p.id);
    load();
  };

  return (
    <AdminLayout>
      <div className="admin-table-wrap">
        {loading ? (
          <div className="admin-empty">불러오는 중...</div>
        ) : pins.length === 0 ? (
          <div className="admin-empty">등록된 리뷰가 없습니다.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>작성자</th>
                <th>식당</th>
                <th>별점</th>
                <th>메모</th>
                <th>작성일</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {pins.map((p) => (
                <tr key={p.id}>
                  <td>{p.user.nickname}</td>
                  <td>{p.restaurant.name}</td>
                  <td>{'★'.repeat(p.rating)}</td>
                  <td className="admin-table__truncate">{p.memo ?? '-'}</td>
                  <td>{new Date(p.createdAt).toLocaleDateString('ko-KR')}</td>
                  <td>
                    <button className="admin-action-btn admin-action-btn--danger" onClick={() => handleDelete(p)}>
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
