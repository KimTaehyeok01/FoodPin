import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import OnboardingPage from './pages/auth/OnboardingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AuthCallback from './pages/auth/AuthCallback';
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';
import NotificationsPage from './pages/NotificationsPage';
import NotificationSettingsPage from './pages/NotificationSettingsPage';
import MyPage from './pages/my/MyPage';
import FavoritesPage from './pages/my/FavoritesPage';
import RestaurantDetailPage from './pages/restaurant/RestaurantDetailPage';
import RestaurantListPage from './pages/restaurant/RestaurantListPage';
import BottomNav from './components/BottomNav';
import './App.css';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (token) return <>{children}</>;
  const seen = localStorage.getItem('onboarding_seen');
  return <Navigate to={seen ? '/login' : '/onboarding'} replace />;
}

const BASE_PATHS = ['/', '/map', '/mypage'];

// 베이스 페이지(홈·지도·마이)는 항상 마운트 상태를 유지한다.
// 슬라이드-인 오버레이 페이지가 position:fixed로 위를 덮고,
// navigate(-1)로 돌아올 때 베이스 페이지가 이미 렌더링되어 있어 깜빡임이 없다.
function AppLayout() {
  const location = useLocation();
  const isBase = BASE_PATHS.includes(location.pathname);

  // 오버레이 페이지에 있는 동안 마지막으로 활성화된 베이스 경로를 기억한다
  const [lastBase, setLastBase] = useState('/');
  useEffect(() => {
    if (isBase) setLastBase(location.pathname);
  }, [location.pathname, isBase]);

  const activeBase = isBase ? location.pathname : lastBase;

  return (
    <div className="app-shell">
      {/* 베이스 페이지 — 항상 마운트, CSS display로만 전환 */}
      <div style={{ display: activeBase === '/' ? 'block' : 'none' }}>
        <HomePage />
      </div>
      <div style={{ display: activeBase === '/map' ? 'block' : 'none' }}>
        <MapPage />
      </div>
      <div style={{ display: activeBase === '/mypage' ? 'block' : 'none' }}>
        <MyPage />
      </div>

      {/* 슬라이드-인 오버레이 — 경로가 일치할 때만 마운트 */}
      <Routes>
        <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />
        <Route path="/restaurants" element={<RestaurantListPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/notification-settings" element={<NotificationSettingsPage />} />
      </Routes>

      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/onboarding" element={<div className="app-shell"><OnboardingPage /></div>} />
        <Route path="/login" element={<div className="app-shell"><LoginPage /></div>} />
        <Route path="/register" element={<div className="app-shell"><RegisterPage /></div>} />
        <Route path="/auth/callback" element={<div className="app-shell"><AuthCallback /></div>} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
