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

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-blue-500"
    >
      <div className="p-4 flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
            {otherParticipant?.name?.charAt(0).toUpperCase() || <User className="h-6 w-6" />}
          </div>
        </div>

        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {otherParticipant?.name || 'Unknown User'}
            </h3>
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
              {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
            </span>
          </div>

          {conversation.lastMessage && (
            <p className="text-sm truncate text-gray-600">
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
