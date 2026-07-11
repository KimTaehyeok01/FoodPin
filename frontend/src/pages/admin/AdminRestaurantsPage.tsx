// 관리자 - 식당관리: 목록 검색, 삭제
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import type { AdminRestaurant } from '../../api/admin';
import AdminLayout from './AdminLayout';
import './AdminTable.css';

export default function AdminRestaurantsPage() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = (q?: string) => {
    setLoading(true);
    adminApi.getRestaurants(q)
      .then(setRestaurants)
      .catch(() => {
        localStorage.removeItem('admin_token');
        navigate('/admin/login', { replace: true });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(search.trim() || undefined);
  };

  const handleDelete = async (r: AdminRestaurant) => {
    if (!confirm(`'${r.name}' 식당을 삭제하시겠습니까? 관련 핀·리뷰가 함께 삭제됩니다.`)) return;
    await adminApi.deleteRestaurant(r.id);
    load(search.trim() || undefined);
  };

  return (
    <AdminLayout>
      <form className="admin-toolbar" onSubmit={handleSearch}>
        <input
          placeholder="식당 이름 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit">검색</button>
      </form>

      <div className="admin-table-wrap">
        {loading ? (
          <div className="admin-empty">불러오는 중...</div>
        ) : restaurants.length === 0 ? (
          <div className="admin-empty">식당이 없습니다.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>이름</th>
                <th>주소</th>
                <th>카테고리</th>
                <th>등록일</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.name}</td>
                  <td className="admin-table__truncate">{r.address ?? '-'}</td>
                  <td>{r.category ?? '-'}</td>
                  <td>{new Date(r.createdAt).toLocaleDateString('ko-KR')}</td>
                  <td>
                    <button className="admin-action-btn admin-action-btn--danger" onClick={() => handleDelete(r)}>
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
