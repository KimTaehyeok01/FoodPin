// 내 뱃지 전체보기 — 획득 조건과 진행률을 함께 표시
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { pinsApi } from '../../api/restaurants';
import type { Pin } from '../../api/restaurants';
import { BADGE_DEFS, isBadgeEarned } from '../../utils/badges';
import './BadgesPage.css';

export default function BadgesPage() {
  const navigate = useNavigate();
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleBack = () => setIsLeaving(true);

  useEffect(() => {
    pinsApi.getMyPins()
      .then(setPins)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const earnedCount = BADGE_DEFS.filter((b) => isBadgeEarned(b, pins)).length;

  return (
    <div
      className={`bdg-page${isLeaving ? ' bdg-page--leaving' : ''}`}
      onAnimationEnd={(e) => { if (isLeaving && e.target === e.currentTarget) navigate(-1); }}
    >
      <header className="bdg-header">
        <button className="bdg-back" onClick={handleBack} aria-label="뒤로가기">
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>
        <h1 className="bdg-title">내 뱃지</h1>
      </header>

      <div className="bdg-body">
        {loading ? (
          <div className="bdg-skeleton" />
        ) : (
          <>
            <p className="bdg-summary">
              총 {BADGE_DEFS.length}개 중 <b>{earnedCount}개</b> 획득
            </p>
            <div className="bdg-grid">
              {BADGE_DEFS.map((b) => {
                const progress = b.getProgress(pins);
                const earned = isBadgeEarned(b, pins);
                const percent = Math.min(100, Math.round((progress / b.target) * 100));
                return (
                  <div key={b.id} className={`bdg-card ${earned ? '' : 'bdg-card--locked'}`}>
                    <div className="bdg-card__icon">{b.emoji}</div>
                    <p className="bdg-card__label">{b.label}</p>
                    <p className="bdg-card__desc">{b.description}</p>
                    <div className="bdg-card__bar">
                      <div className="bdg-card__bar-fill" style={{ width: `${percent}%` }} />
                    </div>
                    <p className="bdg-card__progress">
                      {Math.min(progress, b.target)}/{b.target}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
