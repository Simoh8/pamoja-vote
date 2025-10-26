import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, MapPin, Trophy, Plus } from 'lucide-react';
import { isAuthenticated } from '../api';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Don't render bottom nav if user is not authenticated
  if (!isAuthenticated()) {
    return null;
  }

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/squad', icon: Users, label: 'Squads' },
    { path: '/find-centers', icon: MapPin, label: 'Centers' },
    { path: '/leaderboard', icon: Trophy, label: 'Top' },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:hidden safe-area-inset-bottom">
      <div className="grid grid-cols-4 gap-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                flex flex-col items-center justify-center 
                py-2 px-1 transition-all duration-200 
                min-h-[56px] relative
                ${active
                  ? 'text-primary bg-primary/5'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/80'
                }
              `}
            >
              {/* Active indicator bar */}
              {active && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
              
              <Icon 
                className={`
                  w-4 h-4 mb-1 transition-transform duration-200
                  ${active ? 'scale-110 fill-current' : 'scale-100'}
                `} 
              />
              <span className="text-[10px] xs:text-xs font-medium leading-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;