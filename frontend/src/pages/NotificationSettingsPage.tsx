// 알림 설정 페이지 — 종류별 토글 + 근처 맛집 반경 선택
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { NOTI_KEYS, getNotiSettings } from '../utils/notiSettings';
import './NotificationSettingsPage.css';

const RADIUS_OPTIONS = [1, 5, 10];

export default function NotificationSettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(getNotiSettings);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleBack = () => setIsLeaving(true);

  const toggle = (key: 'nearbyEnabled' | 'reviewEnabled') => {
    const next = !settings[key];
    setSettings((s) => ({ ...s, [key]: next }));
    localStorage.setItem(
      key === 'nearbyEnabled' ? NOTI_KEYS.nearby : NOTI_KEYS.review,
      String(next),
    );
  };

  const setRadius = (km: number) => {
    setSettings((s) => ({ ...s, radiusKm: km }));
    localStorage.setItem(NOTI_KEYS.radius, String(km));
  };

  return (
    <div
      className={`noti-settings-page${isLeaving ? ' noti-settings-page--leaving' : ''}`}
      onAnimationEnd={(e) => { if (isLeaving && e.target === e.currentTarget) navigate(-1); }}
    >
      <header className="noti-settings-header">
        <button className="noti-settings-back" onClick={handleBack} aria-label="뒤로가기">
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>
        <h1 className="noti-settings-title">알림 설정</h1>
      </header>

      <div className="noti-settings-body">
        <p className="noti-settings-section-label">알림 종류</p>

        <div className="noti-settings-card">
          <div className="noti-settings-row">
            <div className="noti-settings-row__info">
              <span className="noti-settings-row__label">근처 새 맛집 알림</span>
              <span className="noti-settings-row__desc">내 위치 근처에 새 식당이 등록되면 알려줘요</span>
            </div>
            <button
              className={`noti-toggle ${settings.nearbyEnabled ? 'noti-toggle--on' : ''}`}
              onClick={() => toggle('nearbyEnabled')}
              aria-pressed={settings.nearbyEnabled}
            >
              <span className="noti-toggle__thumb" />
            </button>
          </div>

          {settings.nearbyEnabled && (
            <div className="noti-settings-radius">
              <span className="noti-settings-radius__label">알림 반경</span>
              <div className="noti-settings-radius__options">
                {RADIUS_OPTIONS.map((km) => (
                  <button
                    key={km}
                    className={`noti-radius-btn ${settings.radiusKm === km ? 'noti-radius-btn--active' : ''}`}
                    onClick={() => setRadius(km)}
                  >
                    {km}km
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="noti-settings-divider" />

          <div className="noti-settings-row">
            <div className="noti-settings-row__info">
              <span className="noti-settings-row__label">내 핀 식당 새 리뷰 알림</span>
              <span className="noti-settings-row__desc">핀한 식당에 다른 사람이 리뷰를 남기면 알려줘요</span>
            </div>
            <button
              className={`noti-toggle ${settings.reviewEnabled ? 'noti-toggle--on' : ''}`}
              onClick={() => toggle('reviewEnabled')}
              aria-pressed={settings.reviewEnabled}
            >
              <span className="noti-toggle__thumb" />
            </button>
          </div>
        </div>

        <p className="noti-settings-note">알림은 앱에 접속할 때마다 업데이트돼요.</p>
      </div>
    </div>
  );
}
