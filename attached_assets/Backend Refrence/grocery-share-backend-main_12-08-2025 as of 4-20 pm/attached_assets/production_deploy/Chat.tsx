import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getConversations, getMessages, sendMessage, markMessagesAsRead, confirmPickup, type Conversation, type Message } from '../api/chat';
import { revealAddress } from '../api/address';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { RatingModal } from '../components/RatingModal';
import { Send, MessageSquare, MapPin, Eye, CheckCircle } from 'lucide-react';

export const Chat = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [initialLoad, setInitialLoad] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isNewConversation, setIsNewConversation] = useState(false);
  const [revealingAddress, setRevealingAddress] = useState(false);
  const [revealedAddress, setRevealedAddress] = useState<string | null>(null);
  const [confirmingPickup, setConfirmingPickup] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingUserId, setRatingUserId] = useState('');
  const [ratingUserName, setRatingUserName] = useState('');

  const receiverId = searchParams.get('receiverId');
  const itemId = searchParams.get('itemId');

  useEffect(() => {
    if (receiverId) {
      setSelectedConversation(null);
      setMessages([]);
      setIsNewConversation(true);
      fetchConversations(true);
    } else {
      fetchConversations(true);
    }
    
    const interval = setInterval(() => {
      fetchConversations(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [receiverId]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      markMessagesAsRead(selectedConversation.id);
      
      const interval = setInterval(() => {
        fetchMessages(selectedConversation.id);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async (selectFirstOrMatch = false) => {
    try {
      const response = await getConversations();
      setConversations(response.conversations);
      
      if (selectFirstOrMatch && response.conversations.length > 0) {
        if (receiverId) {
          const matchingConv = response.conversations.find(conv => 
            conv.participants.some(p => p.id === receiverId)
          );
          if (matchingConv) {
            setSelectedConversation(matchingConv);
            setIsNewConversation(false);
          }
        } else if (!selectedConversation) {
          setSelectedConversation(response.conversations[0]);
        }
      }
    } catch (err) {
      showToast('Failed to load conversations', 'error');
    } finally {
      if (initialLoad) setInitialLoad(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await getMessages(conversationId);
      setMessages(response.messages);
    } catch (err) {
      showToast('Failed to load messages', 'error');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      setSendingMessage(true);
      
      if (selectedConversation) {
        const otherParticipant = selectedConversation.participants.find(p => p.id !== user?.id);
        if (otherParticipant) {
          await sendMessage(otherParticipant.id, messageText);
          await fetchMessages(selectedConversation.id);
          showToast('Message sent!', 'success');
        }
      } else if (isNewConversation && receiverId) {
        await sendMessage(receiverId, messageText, itemId || undefined);
        const response = await getConversations();
        setConversations(response.conversations);
        
        const newConv = response.conversations.find(conv => 
          conv.participants.some(p => p.id === receiverId)
        );
        if (newConv) {
          setSelectedConversation(newConv);
          await fetchMessages(newConv.id);
          setIsNewConversation(false);
          navigate('/chat', { replace: true });
        }
        showToast('Message sent successfully!', 'success');
      }
    } catch (err) {
      showToast('Failed to send message', 'error');
      setNewMessage(messageText);
    } finally {
      setSendingMessage(false);
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.id !== user?.id);
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setIsNewConversation(false);
    setRevealedAddress(null);
    if (receiverId) {
      navigate('/chat', { replace: true });
    }
  };

  const handleRevealAddress = async () => {
    if (!selectedConversation) return;

    try {
      setRevealingAddress(true);
      const response = await revealAddress(selectedConversation.id);
      
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
    if (!selectedConversation) return;

    try {
      setConfirmingPickup(true);
      const response = await confirmPickup(selectedConversation.id);
      
      if (response.pickupConfirmed) {
        showToast('Pickup completed! Please rate your experience.', 'success');
        const otherUser = getOtherParticipant(selectedConversation);
        setRatingUserId(otherUser?.id || '');
        setRatingUserName(otherUser?.name || '');
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

  if (initialLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Messages</h1>

        <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height: '70vh' }}>
          <div className="flex h-full">
            <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
              {conversations.length === 0 && !isNewConversation ? (
                <div className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium mb-2">No conversations yet</p>
                  <p className="text-sm text-gray-400 mb-4">To start a conversation, find an item you're interested in and click "Contact Seller"</p>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition text-sm"
                  >
                    Browse Items
                  </button>
                </div>
              ) : conversations.length === 0 && isNewConversation ? (
                <div className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-700 font-medium">New Conversation</p>
                  <p className="text-sm text-gray-500 mt-2">Send a message to start chatting!</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const otherUser = getOtherParticipant(conv);
                  return (
                    <div
                      key={conv.id}
                      onClick={() => handleConversationSelect(conv)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
                        selectedConversation?.id === conv.id ? 'bg-green-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {conv.item?.imageURL && (
                          <img
                            src={conv.item.imageURL}
                            alt={conv.item.name}
                            className="w-12 h-12 rounded object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{otherUser?.name}</p>
                          {conv.item && (
                            <p className="text-xs text-gray-500 truncate">Re: {conv.item.name}</p>
                          )}
                          <p className="text-sm text-gray-600 truncate mt-1">{conv.lastMessage}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex-1 flex flex-col">
              {selectedConversation || isNewConversation ? (
                <>
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    {selectedConversation ? (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {getOtherParticipant(selectedConversation)?.name}
                            </p>
                            {selectedConversation.item && (
                              <p className="text-sm text-gray-600">About: {selectedConversation.item.name}</p>
                            )}
                          </div>
                          {selectedConversation.item && (
                            <div className="flex gap-2">
                              <button
                                onClick={handleRevealAddress}
                                disabled={revealingAddress}
                                className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                              >
                                <Eye className="h-4 w-4" />
                                {revealingAddress ? 'Loading...' : 'Reveal Address'}
                              </button>
                              <button
                                onClick={handleConfirmPickup}
                                disabled={confirmingPickup}
                                className="flex items-center gap-2 px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50"
                              >
                                <CheckCircle className="h-4 w-4" />
                                {confirmingPickup ? 'Loading...' : 'Confirm Pickup'}
                              </button>
                            </div>
                          )}
                        </div>
                        {revealedAddress && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-green-800">Pickup Address:</p>
                                <p className="text-sm text-green-700">{revealedAddress}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="font-semibold text-gray-900">New Conversation</p>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg) => {
                      const isMyMessage = msg.sender.id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              isMyMessage
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-200 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{msg.message}</p>
                            <p className={`text-xs mt-1 ${isMyMessage ? 'text-green-100' : 'text-gray-500'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        disabled={sendingMessage}
                      />
                      <button
                        type="submit"
                        disabled={sendingMessage || !newMessage.trim()}
                        className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {sendingMessage ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Send
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center px-8">
                    <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">Select a conversation to start messaging</p>
                    <p className="text-sm text-gray-400">Or browse items to find something you'd like and contact the seller</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        rateeId={ratingUserId}
        rateeName={ratingUserName}
        itemId={selectedConversation?.item?.id}
        conversationId={selectedConversation?.id}
        onSuccess={() => {
          setShowRatingModal(false);
          showToast('Thank you for your feedback!', 'success');
        }}
      />
    </div>
  );
};
