import { apiClient } from './config';

export interface Badge {
  _id: string;
  name: string;
  description: string;
  icon: string;
  criteria: string;
  category: 'sharing' | 'engagement' | 'community' | 'milestone';
}

export interface UserBadge {
  badge: Badge;
  earnedAt: string;
}

export const getAllBadges = async () => {
  const response = await apiClient.get('/gamification/badges');
  return response.data;
};

export const getUserBadges = async (userId: string) => {
  const response = await apiClient.get(`/gamification/users/${userId}/badges`);
  return response.data;
};
