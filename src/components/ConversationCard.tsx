import { User, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { type Conversation } from '../api/chat';

interface ConversationCardProps {
  conversation: Conversation;
  currentUserId: string;
  onClick: () => void;
}

export const ConversationCard: React.FC<ConversationCardProps> = ({ conversation, currentUserId, onClick }) => {
  const otherParticipant = conversation.participants.find(p => p.id !== currentUserId);
  const hasUnread = (conversation.unreadCount ?? 0) > 0;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all cursor-pointer border-l-4 ${
        hasUnread ? 'border-l-green-500' : 'border-l-blue-500'
      }`}
    >
      <div className="p-4 flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
            {otherParticipant?.name?.charAt(0).toUpperCase() || <User className="h-6 w-6" />}
          </div>
          {hasUnread && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
              {conversation.unreadCount}
            </span>
          )}
        </div>

        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className={`text-lg font-semibold truncate ${hasUnread ? 'text-gray-900' : 'text-gray-700'}`}>
              {otherParticipant?.name || 'Unknown User'}
            </h3>
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
              {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
            </span>
          </div>

          {conversation.lastMessage && (
            <p className={`text-sm truncate ${hasUnread ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
              {conversation.lastMessage}
            </p>
          )}

          {conversation.item && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <MessageCircle className="h-3 w-3" />
              <span className="truncate">About: {conversation.item.name}</span>
            </div>
          )}
        </div>

        <div className="flex-shrink-0">
          <MessageCircle className="h-6 w-6 text-blue-500" />
        </div>
      </div>
    </div>
  );
};
