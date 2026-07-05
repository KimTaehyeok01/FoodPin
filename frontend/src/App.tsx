import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import OnboardingPage from './pages/auth/OnboardingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AuthCallback from './pages/auth/AuthCallback';
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';
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

function AppLayout() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/restaurants" element={<RestaurantListPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />
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
