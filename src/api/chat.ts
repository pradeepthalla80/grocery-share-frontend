import { apiClient } from './config';

export interface Conversation {
  id: string;
  participants: {
    id: string;
    name: string;
    email: string;
  }[];
  item?: {
    id: string;
    name: string;
    imageURL?: string;
  };
  lastMessage: string;
  lastMessageAt: string;
  createdAt: string;
}

export interface Message {
  id: string;
  sender: {
    id: string;
    name: string;
  };
  receiver: {
    id: string;
    name: string;
  };
  message: string;
  read: boolean;
  createdAt: string;
}

export const getConversations = async (): Promise<{ count: number; conversations: Conversation[] }> => {
  const response = await apiClient.get('/chat/conversations');
  return response.data;
};

export const getMessages = async (conversationId: string): Promise<{ count: number; messages: Message[] }> => {
  const response = await apiClient.get(`/chat/conversations/${conversationId}/messages`);
  return response.data;
};

export const sendMessage = async (receiverId: string, message: string, itemId?: string): Promise<any> => {
  const response = await apiClient.post('/chat/messages', { receiverId, message, itemId });
  return response.data;
};

export const markMessagesAsRead = async (conversationId: string): Promise<void> => {
  await apiClient.put(`/chat/conversations/${conversationId}/read`);
};

export const confirmPickup = async (conversationId: string) => {
  const response = await apiClient.post(`/chat/conversations/${conversationId}/confirm-pickup`);
  return response.data;
};
