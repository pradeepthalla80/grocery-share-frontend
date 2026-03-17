import { apiClient } from './config';

export interface Notification {
  id: string;
  type: 'nearby_free' | 'nearby_discounted' | 'expiring_soon' | 'new_match' | 'new_message' | 'pickup_request' | 'request_accepted' | 'request_declined' | 'request_canceled' | 'pickup_confirmed' | 'exchange_completed' | 'store_request_new' | 'store_request_approved' | 'store_request_rejected' | 'waitlist_joined';
  message: string;
  read: boolean;
  item: {
    id: string;
    name: string;
    price: number;
    isFree: boolean;
    imageURL?: string;
  } | null;
  metadata?: {
    requestId?: string;
    deliveryMode?: string;
    address?: string;
    instructions?: string;
    itemName?: string;
    [key: string]: unknown;
  };
  createdAt: string;
}

export const getNotifications = async (unreadOnly = false): Promise<{ count: number; notifications: Notification[] }> => {
  const response = await apiClient.get(`/notifications${unreadOnly ? '?unreadOnly=true' : ''}`);
  return response.data;
};

export const markNotificationAsRead = async (id: string): Promise<void> => {
  await apiClient.put(`/notifications/${id}/read`);
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await apiClient.put('/notifications/read-all');
};

export const deleteNotification = async (id: string): Promise<void> => {
  await apiClient.delete(`/notifications/${id}`);
};
