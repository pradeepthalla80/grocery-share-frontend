import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ShoppingBasket, LogOut, User, Home, Package, MessageCircle, HandHeart, Shield, TrendingUp, Menu, X } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { useAdmin } from '../hooks/useAdmin';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { hasAdminAccess } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <ShoppingBasket className="h-7 w-7 sm:h-8 sm:w-8 text-green-600" />
              <span className="text-lg sm:text-xl font-bold text-gray-900">Grocery Share</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          {isAuthenticated && (
            <div className="hidden lg:flex items-center space-x-2">
              <Link to="/dashboard" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition ${location.pathname === '/dashboard' ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:text-green-600 hover:bg-gray-100'}`}>
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <Link to="/my-items" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition ${location.pathname === '/my-items' ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:text-green-600 hover:bg-gray-100'}`}>
                <Package className="h-4 w-4" />
                <span>My Items</span>
              </Link>
              <Link to="/chat" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition ${location.pathname === '/chat' ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:text-green-600 hover:bg-gray-100'}`}>
                <MessageCircle className="h-4 w-4" />
                <span>Messages</span>
              </Link>
              <Link to="/item-requests" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition ${location.pathname === '/item-requests' ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:text-green-600 hover:bg-gray-100'}`}>
                <HandHeart className="h-4 w-4" />
                <span>Requests</span>
              </Link>
              <Link to="/analytics" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition ${location.pathname === '/analytics' ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:text-green-600 hover:bg-gray-100'}`}>
                <TrendingUp className="h-4 w-4" />
                <span>Impact</span>
              </Link>
              {hasAdminAccess && (
                <Link to="/admin" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition ${location.pathname === '/admin' ? 'bg-purple-100 text-purple-700' : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'}`}>
                  <Shield className="h-4 w-4" />
                  <span>Admin</span>
                </Link>
              )}
            </div>
          )}

          {/* Right Side - Desktop */}
          <div className="hidden lg:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <NotificationBell />
                <Link to="/profile" className="flex items-center space-x-2 text-gray-700 hover:text-green-600 transition">
                  <User className="h-5 w-5" />
                  <span className="text-sm font-medium">{user?.name}</span>
                </Link>
                <button onClick={handleLogout} className="flex items-center space-x-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition">
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium">Login</Link>
                <Link to="/register" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition">Sign Up</Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center space-x-3">
            {isAuthenticated && <NotificationBell />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:text-green-600 hover:bg-gray-100 focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-3 space-y-1">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className={`flex items-center space-x-3 px-4 py-3 rounded-md font-medium transition min-h-[44px] ${location.pathname === '/dashboard' ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <Home className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
                <Link to="/my-items" onClick={() => setMobileMenuOpen(false)} className={`flex items-center space-x-3 px-4 py-3 rounded-md font-medium transition min-h-[44px] ${location.pathname === '/my-items' ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <Package className="h-5 w-5" />
                  <span>My Items</span>
                </Link>
                <Link to="/chat" onClick={() => setMobileMenuOpen(false)} className={`flex items-center space-x-3 px-4 py-3 rounded-md font-medium transition min-h-[44px] ${location.pathname === '/chat' ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <MessageCircle className="h-5 w-5" />
                  <span>Messages</span>
                </Link>
                <Link to="/item-requests" onClick={() => setMobileMenuOpen(false)} className={`flex items-center space-x-3 px-4 py-3 rounded-md font-medium transition min-h-[44px] ${location.pathname === '/item-requests' ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <HandHeart className="h-5 w-5" />
                  <span>Requests</span>
                </Link>
                <Link to="/analytics" onClick={() => setMobileMenuOpen(false)} className={`flex items-center space-x-3 px-4 py-3 rounded-md font-medium transition min-h-[44px] ${location.pathname === '/analytics' ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <TrendingUp className="h-5 w-5" />
                  <span>Impact</span>
                </Link>
                {hasAdminAccess && (
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className={`flex items-center space-x-3 px-4 py-3 rounded-md font-medium transition min-h-[44px] ${location.pathname === '/admin' ? 'bg-purple-100 text-purple-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                    <Shield className="h-5 w-5" />
                    <span>Admin</span>
                  </Link>
                )}
                <div className="border-t border-gray-200 mt-2 pt-2">
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center space-x-3 px-4 py-3 rounded-md text-gray-700 hover:bg-gray-100 font-medium transition min-h-[44px]">
                    <User className="h-5 w-5" />
                    <span>{user?.name}</span>
                  </Link>
                  <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-3 rounded-md bg-red-600 text-white hover:bg-red-700 font-medium transition min-h-[44px]">
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-md text-gray-700 hover:bg-gray-100 font-medium min-h-[44px]">Login</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-md bg-green-600 text-white hover:bg-green-700 font-medium min-h-[44px]">Sign Up</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
