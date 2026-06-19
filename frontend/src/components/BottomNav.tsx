import { NavLink } from 'react-router-dom';
import { Home, Map, User } from 'lucide-react';
import './BottomNav.css';

const tabs = [
  { to: '/', Icon: Home, label: '홈' },
  { to: '/map', Icon: Map, label: '지도' },
  { to: '/mypage', Icon: User, label: '마이' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav__pc-logo">FoodPin</div>
      {tabs.map(({ to, Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            'bottom-nav__item' + (isActive ? ' bottom-nav__item--active' : '')
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={21} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="bottom-nav__label">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
