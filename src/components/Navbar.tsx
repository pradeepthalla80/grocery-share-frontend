import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut, User, Home, Package, MessageCircle, HandHeart, Shield, TrendingUp, Menu, X, Store, Truck, ChevronDown } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { useAdmin } from '../hooks/useAdmin';
import { useStore } from '../hooks/useStore';
import { BRANDING } from '../config/branding';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { hasAdminAccess } = useAdmin();
  const { isStoreOwner } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [myItemsDropdownOpen, setMyItemsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMyItemsDropdownOpen(false);
  }, [location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMyItemsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  // Hide logo on login/register pages (form already has logo)
  const hideNavLogo = ['/login', '/register'].includes(location.pathname);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-2">
          {/* Logo - Hidden on login/register pages */}
          {!hideNavLogo && (
            <Link to="/" className="flex-shrink-0">
              <img 
                src={BRANDING.LOGO_PATH} 
                alt={BRANDING.APP_NAME}
                className="h-6 sm:h-8 lg:h-10 w-auto object-contain"
              />
            </Link>
          )}

          {/* Desktop Menu */}
          {isAuthenticated && (
            <div className="hidden lg:flex items-center space-x-2">
              <Link to="/dashboard" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition ${location.pathname === '/dashboard' ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:text-green-600 hover:bg-gray-100'}`}>
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              
              {/* My Items Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setMyItemsDropdownOpen(!myItemsDropdownOpen)}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition ${['/my-items', '/item-requests'].includes(location.pathname) ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:text-green-600 hover:bg-gray-100'}`}
                >
                  <Package className="h-4 w-4" />
                  <span>My Items</span>
                  <ChevronDown className={`h-3 w-3 transition-transform ${myItemsDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {myItemsDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[160px] z-50">
                    <Link
                      to="/my-items"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                      onClick={() => setMyItemsDropdownOpen(false)}
                    >
                      My Listed Items
                    </Link>
                    <Link
                      to="/item-requests"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                      onClick={() => setMyItemsDropdownOpen(false)}
                    >
                      My Requests
                    </Link>
                  </div>
                )}
              </div>

              <Link to="/chat" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition ${location.pathname === '/chat' ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:text-green-600 hover:bg-gray-100'}`}>
                <MessageCircle className="h-4 w-4" />
                <span>Messages</span>
              </Link>
              <Link to="/pickup-requests" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition ${location.pathname === '/pickup-requests' ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:text-green-600 hover:bg-gray-100'}`}>
                <Truck className="h-4 w-4" />
                <span>Pickups</span>
              </Link>
              <Link to="/analytics" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition ${location.pathname === '/analytics' ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:text-green-600 hover:bg-gray-100'}`}>
                <TrendingUp className="h-4 w-4" />
                <span>Impact</span>
              </Link>
              {isStoreOwner && (
                <Link to="/store-dashboard" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition ${location.pathname === '/store-dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'}`}>
                  <Store className="h-4 w-4" />
                  <span>My Store</span>
                </Link>
              )}
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
                  <span>My Listed Items</span>
                </Link>
                <Link to="/item-requests" onClick={() => setMobileMenuOpen(false)} className={`flex items-center space-x-3 px-4 py-3 rounded-md font-medium transition min-h-[44px] ${location.pathname === '/item-requests' ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <HandHeart className="h-5 w-5" />
                  <span>My Requests</span>
                </Link>
                <Link to="/chat" onClick={() => setMobileMenuOpen(false)} className={`flex items-center space-x-3 px-4 py-3 rounded-md font-medium transition min-h-[44px] ${location.pathname === '/chat' ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <MessageCircle className="h-5 w-5" />
                  <span>Messages</span>
                </Link>
                <Link to="/pickup-requests" onClick={() => setMobileMenuOpen(false)} className={`flex items-center space-x-3 px-4 py-3 rounded-md font-medium transition min-h-[44px] ${location.pathname === '/pickup-requests' ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <Truck className="h-5 w-5" />
                  <span>Pickups</span>
                </Link>
                <Link to="/analytics" onClick={() => setMobileMenuOpen(false)} className={`flex items-center space-x-3 px-4 py-3 rounded-md font-medium transition min-h-[44px] ${location.pathname === '/analytics' ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <TrendingUp className="h-5 w-5" />
                  <span>Impact</span>
                </Link>
                {isStoreOwner && (
                  <Link to="/store-dashboard" onClick={() => setMobileMenuOpen(false)} className={`flex items-center space-x-3 px-4 py-3 rounded-md font-medium transition min-h-[44px] ${location.pathname === '/store-dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                    <Store className="h-5 w-5" />
                    <span>My Store</span>
                  </Link>
                )}
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
