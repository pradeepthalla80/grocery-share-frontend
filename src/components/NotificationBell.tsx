import { Bell, MessageCircle, Package, ShoppingBag } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const getNotifIcon = (type: string) => {
  switch (type) {
    case 'new_message': return <MessageCircle className="h-4 w-4 text-blue-500" />;
    case 'pickup_request':
    case 'request_accepted':
    case 'request_declined':
    case 'request_canceled':
    case 'pickup_confirmed':
    case 'exchange_completed':
      return <ShoppingBag className="h-4 w-4 text-green-500" />;
    case 'nearby_free':
    case 'nearby_discounted':
    case 'new_match':
    case 'expiring_soon':
      return <Package className="h-4 w-4 text-orange-500" />;
    default: return <Package className="h-4 w-4 text-gray-500" />;
  }
};

const getNotifRoute = (type: string): string => {
  switch (type) {
    case 'new_message': return '/chat';
    case 'pickup_request': return '/my-items';
    case 'request_accepted':
    case 'request_declined':
    case 'request_canceled':
    case 'pickup_confirmed':
    case 'exchange_completed':
      return '/my-items';
    case 'nearby_free':
    case 'nearby_discounted':
    case 'new_match':
    case 'expiring_soon':
      return '/dashboard';
    case 'store_request_new':
    case 'waitlist_joined':
      return '/admin';
    case 'store_request_approved':
    case 'store_request_rejected':
      return '/profile';
    default: return '/dashboard';
  }
};

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleNotifClick = (notif: typeof notifications[0]) => {
    if (!notif.read) markAsRead(notif.id);
    setIsOpen(false);
    navigate(getNotifRoute(notif.type));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-500">{unreadCount} unread</p>
              )}
            </div>
            <div className="divide-y divide-gray-200">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No notifications
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      !notif.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleNotifClick(notif)}
                  >
                    <div className="flex gap-3 items-start">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotifIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notif.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(notif.createdAt), 'MMM dd, h:mm a')}
                        </p>
                      </div>
                      {!notif.read && (
                        <span className="inline-block w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
