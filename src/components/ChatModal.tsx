import { useState, useEffect, useRef } from 'react';
import { X, Send, MapPin, Eye, CheckCircle, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { type Conversation, type Message, sendMessage, getMessages, markMessagesAsRead, confirmPickup } from '../api/chat';
import { revealAddress } from '../api/address';
import { useToast } from '../hooks/useToast';
import { RatingModal } from './RatingModal';

interface ChatModalProps {
  conversation: Conversation | null;
  currentUserId: string;
  receiverId?: string;
  itemId?: string;
  prefilledMessage?: string;
  isNewConversation?: boolean;
  onClose: () => void;
  onConversationCreated?: (receiverId: string) => Promise<void>;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  conversation,
  currentUserId,
  receiverId,
  itemId,
  prefilledMessage,
  isNewConversation = false,
  onClose,
  onConversationCreated
}) => {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState(prefilledMessage || '');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [revealingAddress, setRevealingAddress] = useState(false);
  const [revealedAddress, setRevealedAddress] = useState<string | null>(null);
  const [confirmingPickup, setConfirmingPickup] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingUserId, setRatingUserId] = useState('');
  const [ratingUserName, setRatingUserName] = useState('');
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const otherParticipant = conversation?.participants.find(p => p.id !== currentUserId);

  useEffect(() => {
    if (conversation) {
      fetchMessages();
      markMessagesAsRead(conversation.id);

      const interval = setInterval(() => {
        fetchMessages();
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [conversation]);

  useEffect(() => {
    if (!userHasScrolled) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, userHasScrolled]);

  const fetchMessages = async () => {
    if (!conversation) return;
    try {
      const response = await getMessages(conversation.id);
      setMessages(response.messages);
    } catch (err) {
      console.error('Failed to load messages');
    }
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setUserHasScrolled(!isAtBottom);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setUserHasScrolled(false);

    try {
      setSendingMessage(true);

      if (conversation) {
        await sendMessage(otherParticipant!.id, messageText);
        await fetchMessages();
        showToast('Message sent!', 'success');
      } else if (isNewConversation && receiverId) {
        await sendMessage(receiverId, messageText, itemId || undefined);
        showToast('Message sent successfully!', 'success');
        if (onConversationCreated) {
          await onConversationCreated(receiverId);
        }
      }
    } catch (err) {
      showToast('Failed to send message', 'error');
      setNewMessage(messageText);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleRevealAddress = async () => {
    if (!conversation) return;

    try {
      setRevealingAddress(true);
      const response = await revealAddress(conversation.id);

      if (response.addressRevealed && response.address) {
        setRevealedAddress(response.address);
        showToast('Address revealed to both parties!', 'success');
      } else {
        showToast(`Waiting for other party to agree (${response.revealedBy}/${response.totalParticipants})`, 'info');
      }
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to reveal address', 'error');
    } finally {
      setRevealingAddress(false);
    }
  };

  const handleConfirmPickup = async () => {
    if (!conversation) return;

    try {
      setConfirmingPickup(true);
      const response = await confirmPickup(conversation.id);

      if (response.pickupConfirmed) {
        showToast('Pickup completed! Please rate your experience.', 'success');
        setRatingUserId(otherParticipant?.id || '');
        setRatingUserName(otherParticipant?.name || '');
        setShowRatingModal(true);
      } else {
        showToast(`Waiting for other party to confirm (${response.confirmedBy}/${response.totalParticipants})`, 'info');
      }
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to confirm pickup', 'error');
    } finally {
      setConfirmingPickup(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center font-semibold text-lg">
                {otherParticipant?.name?.charAt(0).toUpperCase() || <User className="h-6 w-6" />}
              </div>
              <div>
                <h2 className="text-xl font-bold">{otherParticipant?.name || 'New Conversation'}</h2>
                {conversation?.item && (
                  <p className="text-sm text-blue-100">About: {conversation.item.name}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {conversation && (
            <div className="bg-blue-50 px-4 py-2 flex gap-2 border-b">
              <button
                onClick={handleRevealAddress}
                disabled={revealingAddress}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm disabled:opacity-50"
              >
                <Eye className="h-4 w-4" />
                {revealingAddress ? 'Requesting...' : 'Reveal Address'}
              </button>
              <button
                onClick={handleConfirmPickup}
                disabled={confirmingPickup}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                {confirmingPickup ? 'Confirming...' : 'Confirm Pickup'}
              </button>
            </div>
          )}

          {revealedAddress && (
            <div className="bg-green-50 px-4 py-3 border-b border-green-200">
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Pickup Address:</p>
                  <p className="text-sm text-green-700">{revealedAddress}</p>
                </div>
              </div>
            </div>
          )}

          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
          >
            {messages.length === 0 && !isNewConversation && (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>No messages yet. Start the conversation!</p>
              </div>
            )}

            {messages.map((message, index) => {
              const isOwnMessage = message.sender.id === currentUserId;
              const isUnread = !isOwnMessage && !message.read;
              return (
                <div key={index} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-end gap-2 max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold text-xs ${
                      isOwnMessage ? 'bg-blue-500' : isUnread ? 'bg-red-500' : 'bg-purple-500'
                    }`}>
                      {message.sender.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className={`px-4 py-2 rounded-2xl ${
                        isOwnMessage
                          ? 'bg-blue-500 text-white rounded-br-none'
                          : isUnread
                          ? 'bg-red-50 text-gray-900 rounded-bl-none shadow-md border-2 border-red-500'
                          : 'bg-white text-gray-800 rounded-bl-none shadow-md'
                      }`}>
                        <p className={`text-sm break-words ${isUnread ? 'font-semibold' : ''}`}>{message.message}</p>
                        {isUnread && (
                          <span className="inline-block ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">New</span>
                        )}
                      </div>
                      <p className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={sendingMessage}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sendingMessage}
                className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
              >
                <Send className="h-5 w-5" />
                Send
              </button>
            </div>
          </form>
        </div>
      </div>

      {showRatingModal && (
        <RatingModal
          isOpen={showRatingModal}
          rateeId={ratingUserId}
          rateeName={ratingUserName}
          onClose={() => setShowRatingModal(false)}
        />
      )}
    </>
  );
};
