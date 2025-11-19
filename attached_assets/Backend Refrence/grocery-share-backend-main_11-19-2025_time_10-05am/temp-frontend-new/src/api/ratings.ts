import { apiClient } from './config';

export interface Rating {
  _id: string;
  rater: {
    _id: string;
    name: string;
    email: string;
  };
  ratee: {
    _id: string;
    name: string;
    email: string;
  };
  rating: number;
  review?: string;
  item?: {
    _id: string;
    name: string;
    imageURL?: string;
  };
  createdAt: string;
}

export const createRating = async (data: {
  ratee: string;
  rating: number;
  review?: string;
  item?: string;
  conversation?: string;
}) => {
  const response = await apiClient.post('/ratings', data);
  return response.data;
};

export const getUserRatings = async (userId: string, page = 1, limit = 10) => {
  const response = await apiClient.get(`/ratings/user/${userId}`, {
    params: { page, limit }
  });
  return response.data;
};

export const getRatingsGiven = async () => {
  const response = await apiClient.get('/ratings/given');
  return response.data;
};

export const canRate = async (ratee: string, item?: string) => {
  const response = await apiClient.get('/ratings/can-rate', {
    params: { ratee, item }
  });
  return response.data;
};
