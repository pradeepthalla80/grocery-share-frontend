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
      className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all cursor-pointer border-l-2 ${
        hasUnread ? 'border-l-red-500' : 'border-l-blue-500'
      }`}
    >
      <div className="p-3 flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
            {otherParticipant?.name?.charAt(0).toUpperCase() || <User className="h-5 w-5" />}
          </div>
          {hasUnread && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
              {conversation.unreadCount}
            </span>
          )}
        </div>

        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <h3 className={`text-sm font-semibold truncate ${hasUnread ? 'text-gray-900' : 'text-gray-700'}`}>
              {otherParticipant?.name || 'Unknown User'}
            </h3>
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
              {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
            </span>
          </div>

          {conversation.lastMessage && (
            <p className={`text-xs truncate ${hasUnread ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
              {conversation.lastMessage}
            </p>
          )}

          {conversation.item && (
            <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
              <MessageCircle className="h-3 w-3" />
              <span className="truncate">{conversation.item.name}</span>
            </div>
          )}
        </div>

        <div className="flex-shrink-0">
          <MessageCircle className="h-5 w-5 text-blue-500" />
        </div>
      </div>
    </div>
  );
};
