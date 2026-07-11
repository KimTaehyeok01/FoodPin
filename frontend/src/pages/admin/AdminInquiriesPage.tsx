// 관리자 - 문의관리: 목록 조회 + 답변 등록
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import type { AdminInquiry } from '../../api/admin';
import AdminLayout from './AdminLayout';
import './AdminTable.css';
import './AdminInquiriesPage.css';

export default function AdminInquiriesPage() {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi.getInquiries()
      .then(setInquiries)
      .catch(() => {
        localStorage.removeItem('admin_token');
        navigate('/admin/login', { replace: true });
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleOpen = (inquiry: AdminInquiry) => {
    setOpenId(inquiry.id);
    setAnswerText(inquiry.answer ?? '');
  };

  const handleSubmitAnswer = async (id: number) => {
    if (!answerText.trim()) return;
    setSubmitting(true);
    try {
      await adminApi.answerInquiry(id, answerText.trim());
      setOpenId(null);
      load();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-inq-list">
        {loading ? (
          <div className="admin-empty">불러오는 중...</div>
        ) : inquiries.length === 0 ? (
          <div className="admin-empty">등록된 문의가 없습니다.</div>
        ) : (
          inquiries.map((inq) => (
            <div key={inq.id} className="admin-inq-item">
              <div className="admin-inq-item__head">
                <div>
                  <span className="admin-inq-item__title">{inq.title}</span>
                  <span className="admin-inq-item__author">{inq.user.nickname} ({inq.user.email ?? '소셜'})</span>
                </div>
                <span className={`admin-badge ${inq.status === 'answered' ? 'admin-badge--ok' : 'admin-badge--warn'}`}>
                  {inq.status === 'answered' ? '답변완료' : '답변대기'}
                </span>
              </div>
              <p className="admin-inq-item__content">{inq.content}</p>
              <span className="admin-inq-item__date">
                {new Date(inq.createdAt).toLocaleDateString('ko-KR')}
              </span>

              {inq.answer && openId !== inq.id && (
                <div className="admin-inq-item__answer">
                  <span>답변</span>
                  <p>{inq.answer}</p>
                </div>
              )}

              {openId === inq.id ? (
                <div className="admin-inq-item__form">
                  <textarea
                    rows={4}
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="답변 내용을 입력하세요"
                  />
                  <div className="admin-inq-item__form-actions">
                    <button className="admin-action-btn" onClick={() => setOpenId(null)}>취소</button>
                    <button
                      className="admin-action-btn"
                      style={{ background: '#ff6b35', color: '#fff' }}
                      onClick={() => handleSubmitAnswer(inq.id)}
                      disabled={submitting || !answerText.trim()}
                    >
                      {submitting ? '등록 중...' : '답변 등록'}
                    </button>
                  </div>
                </div>
              ) : (
                <button className="admin-action-btn" onClick={() => handleOpen(inq)}>
                  {inq.answer ? '답변 수정' : '답변 작성'}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
}
