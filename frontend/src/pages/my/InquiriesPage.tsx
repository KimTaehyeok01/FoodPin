// 1:1 문의 페이지 — 문의 작성 + 내 문의 목록
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { inquiriesApi } from '../../api/restaurants';
import type { Inquiry } from '../../api/restaurants';
import './InquiriesPage.css';

export default function InquiriesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const [writing, setWriting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    inquiriesApi.getMine().then(setItems).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      await inquiriesApi.create({ title: title.trim(), content: content.trim() });
      setTitle('');
      setContent('');
      setWriting(false);
      load();
    } catch {
      alert('문의 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`inq-page${isLeaving ? ' inq-page--leaving' : ''}`}
      onAnimationEnd={(e) => { if (isLeaving && e.target === e.currentTarget) navigate(-1); }}
    >
      <header className="inq-header">
        <button className="inq-back" onClick={() => setIsLeaving(true)} aria-label="뒤로가기">
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>
        <h1 className="inq-title">고객센터</h1>
      </header>

      <div className="inq-body">
        {writing ? (
          <div className="inq-form">
            <input
              className="inq-form__input"
              placeholder="제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
            <textarea
              className="inq-form__textarea"
              placeholder="문의 내용을 입력해주세요"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={2000}
              rows={8}
            />
            <div className="inq-form__actions">
              <button className="inq-form__cancel" onClick={() => setWriting(false)}>취소</button>
              <button
                className="inq-form__submit"
                onClick={handleSubmit}
                disabled={submitting || !title.trim() || !content.trim()}
              >
                {submitting ? '등록 중...' : '등록'}
              </button>
            </div>
          </div>
        ) : (
          <button className="inq-write-btn" onClick={() => setWriting(true)}>
            + 문의하기
          </button>
        )}

        {loading ? (
          <div className="inq-list">
            {[...Array(3)].map((_, i) => <div key={i} className="inq-skeleton" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="inq-empty">
            <p>📮</p>
            <p>아직 등록한 문의가 없어요</p>
          </div>
        ) : (
          <div className="inq-list">
            {items.map((it) => (
              <div key={it.id} className="inq-item">
                <div className="inq-item__head">
                  <span className="inq-item__title">{it.title}</span>
                  <span className={`inq-item__status inq-item__status--${it.status}`}>
                    {it.status === 'answered' ? '답변완료' : '답변대기'}
                  </span>
                </div>
                <p className="inq-item__content">{it.content}</p>
                <span className="inq-item__date">
                  {new Date(it.createdAt).toLocaleDateString('ko-KR')}
                </span>
                {it.answer && (
                  <div className="inq-item__answer">
                    <span className="inq-item__answer-label">답변</span>
                    <p>{it.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
