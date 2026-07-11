// 관리자 - 회원관리: 목록 검색, 정지/해제, 삭제
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import type { AdminUser } from '../../api/admin';
import AdminLayout from './AdminLayout';
import './AdminTable.css';

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = (q?: string) => {
    setLoading(true);
    adminApi.getUsers(q)
      .then(setUsers)
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

  const handleToggleBan = async (user: AdminUser) => {
    await adminApi.setUserBanned(user.id, !user.isBanned);
    load(search.trim() || undefined);
  };

  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`${user.nickname} 회원을 삭제하시겠습니까? 되돌릴 수 없습니다.`)) return;
    await adminApi.deleteUser(user.id);
    load(search.trim() || undefined);
  };

  return (
    <AdminLayout>
      <form className="admin-toolbar" onSubmit={handleSearch}>
        <input
          placeholder="닉네임 또는 이메일 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit">검색</button>
      </form>

      <div className="admin-table-wrap">
        {loading ? (
          <div className="admin-empty">불러오는 중...</div>
        ) : users.length === 0 ? (
          <div className="admin-empty">회원이 없습니다.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>닉네임</th>
                <th>이메일</th>
                <th>가입방식</th>
                <th>권한</th>
                <th>상태</th>
                <th>가입일</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.nickname}</td>
                  <td>{u.email ?? '-'}</td>
                  <td>{u.provider ?? '일반'}</td>
                  <td>
                    <span className={`admin-badge ${u.role === 'admin' ? 'admin-badge--warn' : 'admin-badge--muted'}`}>
                      {u.role === 'admin' ? '관리자' : '일반'}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-badge ${u.isBanned ? 'admin-badge--danger' : 'admin-badge--ok'}`}>
                      {u.isBanned ? '정지됨' : '정상'}
                    </span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString('ko-KR')}</td>
                  <td>
                    <button className="admin-action-btn" onClick={() => handleToggleBan(u)}>
                      {u.isBanned ? '정지 해제' : '정지'}
                    </button>
                    <button className="admin-action-btn admin-action-btn--danger" onClick={() => handleDelete(u)}>
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
