import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut, User, Home, Package, MessageCircle, HandHeart, Menu, X, Store, Shield } from 'lucide-react';
import { NotificationBell } from './NotificationBell';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const baseNavLinks = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/my-items', icon: Package, label: 'My Items' },
    { path: '/chat', icon: MessageCircle, label: 'Messages' },
    { path: '/item-requests', icon: HandHeart, label: 'Requests' },
  ];

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  let navLinks = user?.isStoreOwner
    ? [...baseNavLinks.slice(0, 2), { path: '/my-store', icon: Store, label: 'My Store' }, ...baseNavLinks.slice(2)]
    : [...baseNavLinks];

  if (isAdmin) {
    navLinks = [...navLinks, { path: '/admin', icon: Shield, label: 'Admin' }];
  }

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-nav border-b border-gray-200/80 safe-area-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-12 md:h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-1.5">
                <img src="/logo.png" alt="BaskMate" className="h-8 md:h-10 w-auto" />
              </Link>
              
              {isAuthenticated && (
                <div className="ml-10 hidden md:flex items-center space-x-4">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition ${
                          location.pathname === link.path
                            ? 'bg-green-100 text-green-700'
                            : 'text-gray-700 hover:text-green-600 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 md:space-x-3">
              {isAuthenticated ? (
                <>
                  <NotificationBell />
                  <Link
                    to="/profile"
                    className="hidden md:flex items-center space-x-2 text-gray-700 hover:text-green-600 transition"
                  >
                    <User className="h-5 w-5" />
                    <span className="text-sm font-medium">{user?.name}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="hidden md:flex items-center space-x-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition rounded-lg active:bg-gray-100"
                  >
                    {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition text-sm"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && isAuthenticated && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 z-40 md:hidden animate-fade-in"
            onClick={closeMobileMenu}
          />
          <div className="fixed top-12 right-0 w-72 h-[calc(100vh-3rem)] bg-white z-50 md:hidden shadow-2xl animate-slide-in overflow-y-auto safe-area-top">
            <div className="p-4 bg-green-600">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{user?.name}</p>
                  <p className="text-green-100 text-xs">{user?.email}</p>
                </div>
              </div>
            </div>
            
            <div className="py-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={closeMobileMenu}
                    className={`flex items-center space-x-3 px-5 py-3.5 text-sm font-medium transition touch-ripple ${
                      location.pathname === link.path
                        ? 'bg-green-50 text-green-700 border-l-3 border-green-600'
                        : 'text-gray-700 active:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
              
              <div className="mx-4 my-2 border-t border-gray-100" />
              
              <Link
                to="/profile"
                onClick={closeMobileMenu}
                className={`flex items-center space-x-3 px-5 py-3.5 text-sm font-medium transition touch-ripple ${
                  location.pathname === '/profile'
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-700 active:bg-gray-50'
                }`}
              >
                <User className="h-5 w-5" />
                <span>Profile</span>
              </Link>
              
              <div className="mx-4 my-2 border-t border-gray-100" />
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-5 py-3.5 text-sm font-medium text-red-600 active:bg-red-50 transition w-full touch-ripple"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};
