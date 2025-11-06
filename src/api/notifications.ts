import { apiClient } from './config';

export interface Notification {
  id: string;
  type: 'nearby_free' | 'nearby_discounted' | 'expiring_soon' | 'new_match';
  message: string;
  read: boolean;
  item: {
    id: string;
    name: string;
    price: number;
    isFree: boolean;
    imageURL?: string;
  } | null;
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

export const sendInterestNotification = async (itemId: string, itemName: string, type: 'item' | 'request'): Promise<void> => {
  await apiClient.post('/notifications/interest', { itemId, itemName, type });
};
