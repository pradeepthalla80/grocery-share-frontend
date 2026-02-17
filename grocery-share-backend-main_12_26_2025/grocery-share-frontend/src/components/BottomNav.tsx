import { Link, useLocation } from 'react-router-dom';
import { Home, Plus, MessageCircle, HandHeart, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Home' },
  { path: '/item-requests', icon: HandHeart, label: 'Requests' },
  { path: '/add-item', icon: Plus, label: 'Add', isAction: true },
  { path: '/chat', icon: MessageCircle, label: 'Messages' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export const BottomNav = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-nav border-t border-gray-200/80 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path === '/dashboard' && location.pathname === '/');
          const Icon = item.icon;

          if (item.isAction) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-600 text-white shadow-lg active:scale-90 transition-transform">
                  <Icon className="h-6 w-6" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-90 ${
                isActive
                  ? 'text-green-600'
                  : 'text-gray-700 hover:text-green-600'
              }`}
            >
              <div className={`relative flex items-center justify-center w-10 h-7 rounded-full transition-colors ${
                isActive ? 'bg-green-50' : ''
              }`}>
                <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {isActive && (
                  <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-600 rounded-full animate-scale-in" />
                )}
              </div>
              <span className={`text-[10px] mt-0.5 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
