import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, Heart, Star, MapPin, Bell, UserRound, HelpCircle, LogOut, Edit } from 'lucide-react';
import { pinsApi, usersApi, photoSrc } from '../../api/restaurants';
import type { Pin, UserProfile } from '../../api/restaurants';
import './MyPage.css';

const BADGES = [
  { emoji: '🍜', label: '라멘마스터', active: true },
  { emoji: '🥢', label: '한식러버', active: true },
  { emoji: '☕', label: '카페투어러', active: true },
  { emoji: '🏆', label: '50곳달성', active: false },
  { emoji: '👑', label: '미식가', active: false },
];

const SETTING_ITEMS = [
  { Icon: Bell, label: '알림 설정', color: '#ff6b35', to: '/notification-settings' },
  { Icon: UserRound, label: '프로필 정보 변경', color: '#4caf50', to: '/profile-edit' },
  { Icon: HelpCircle, label: '고객센터', color: '#2196f3', to: null },
];

export default function MyPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [pins, setPins] = useState<Pin[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    pinsApi.getMyPins().then(setPins).catch(console.error);
  }, []);

  // 마이페이지 탭 진입 시마다 프로필 갱신 (keep-alive 상태에서 프로필 변경 반영)
  useEffect(() => {
    if (location.pathname !== '/mypage') return;
    usersApi.getMe().then(setProfile).catch(console.error);
  }, [location.pathname]);

  const pinnedCount = pins.length;
  const reviewCount = pins.filter((p) => p.memo).length;

  const menuItems = [
    { Icon: Heart, label: '찜한 맛집', count: pinnedCount, color: '#ff6b35', to: '/favorites' },
    { Icon: Star, label: '내 리뷰', count: reviewCount, color: '#ffc107', to: '/favorites' },
    { Icon: MapPin, label: '방문한 곳', count: pinnedCount, color: '#4caf50', to: '/favorites' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  return (
    <div className="my-page">
      {/* 헤더 */}
      <div className="my-header">
        <div className="my-profile-row">
          <div className="my-avatar-wrap">
            <div className="my-avatar">
              {profile?.profileImage ? (
                <img src={photoSrc(profile.profileImage)} alt="프로필" className="my-avatar__img" />
              ) : (
                '👤'
              )}
            </div>
          </div>
          <div className="my-profile-info">
            <p className="my-username">{profile?.nickname ?? '푸드핀 유저'}</p>
            <p className="my-email">{profile?.email ?? ''}</p>
            <span className="my-level">🍴 미식 탐험가 Lv.1</span>
          </div>
          <button className="my-edit-btn" onClick={() => navigate('/profile-edit')}>
            <Edit size={14} strokeWidth={2} />
            편집
          </button>
        </div>

        <div className="my-stats">
          <div className="my-stat">
            <span className="my-stat__num">{pinnedCount}</span>
            <span className="my-stat__label">방문</span>
          </div>
          <div className="my-stat__divider" />
          <div className="my-stat">
            <span className="my-stat__num">{reviewCount}</span>
            <span className="my-stat__label">리뷰</span>
          </div>
          <div className="my-stat__divider" />
          <div className="my-stat">
            <span className="my-stat__num">{pinnedCount}</span>
            <span className="my-stat__label">찜</span>
          </div>
          <div className="my-stat__divider" />
          <div className="my-stat">
            <span className="my-stat__num">0</span>
            <span className="my-stat__label">팔로워</span>
          </div>
        </div>
      </div>

      {/* 바디 */}
      <div className="my-body">
        {/* 뱃지 */}
        <div className="my-card">
          <div className="my-card__header">
            <span className="my-card__title">내 뱃지</span>
            <button className="my-card__more">전체보기</button>
          </div>
          <div className="my-badges">
            {BADGES.map((b) => (
              <div key={b.label} className={`my-badge ${b.active ? '' : 'my-badge--locked'}`}>
                <div className="my-badge__icon">{b.emoji}</div>
                <span className="my-badge__label">{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 찜한 맛집 */}
        <div className="my-card">
          <div className="my-card__header">
            <span className="my-card__title">❤️ 찜한 맛집</span>
            {pinnedCount > 0 && (
              <button className="my-card__more" onClick={() => navigate('/favorites')}>전체보기</button>
            )}
          </div>
          {pinnedCount === 0 ? (
            <div className="my-pinned-empty">
              <p>아직 찜한 맛집이 없어요</p>
              <p>마음에 드는 맛집을 핀해보세요 🍽️</p>
            </div>
          ) : (
            <div className="my-pinned-preview">
              {pins.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  className="my-pinned-item"
                  onClick={() => navigate(`/restaurants/${p.restaurant.id}`)}
                >
                  {p.restaurant.photoUrl ? (
                    <img src={photoSrc(p.restaurant.photoUrl)} alt={p.restaurant.name} />
                  ) : (
                    <span className="my-pinned-item__no-img">🍽️</span>
                  )}
                  <span className="my-pinned-item__name">{p.restaurant.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 메뉴 */}
        <div className="my-menu-card">
          {menuItems.map(({ Icon, label, count, color, to }) => (
            <button key={label} className="my-menu-item" onClick={() => navigate(to)}>
              <div className="my-menu-icon" style={{ background: color + '22' }}>
                <Icon size={16} strokeWidth={2} color={color} />
              </div>
              <span className="my-menu-label">{label}</span>
              <span className="my-menu-count" style={{ color }}>{count}개</span>
              <ChevronRight size={16} strokeWidth={2} color="#ddd" />
            </button>
          ))}
        </div>

        <div className="my-menu-card" style={{ marginTop: 12 }}>
          {SETTING_ITEMS.map(({ Icon, label, color, to }) => (
            <button key={label} className="my-menu-item" onClick={() => to && navigate(to)}>
              <div className="my-menu-icon" style={{ background: color + '22' }}>
                <Icon size={16} strokeWidth={2} color={color} />
              </div>
              <span className="my-menu-label">{label}</span>
              <ChevronRight size={16} strokeWidth={2} color="#ddd" />
            </button>
          ))}
        </div>

        <button className="my-logout" onClick={handleLogout}>
          <LogOut size={16} strokeWidth={2} />
          로그아웃
        </button>

        <p className="my-version">FoodPin v1.0.0</p>
      </div>
    </div>
  );
}
