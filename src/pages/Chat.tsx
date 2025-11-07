import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getConversations, getMessages, sendMessage, markMessagesAsRead, confirmPickup, type Conversation, type Message } from '../api/chat';
import { revealAddress } from '../api/address';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { RatingModal } from '../components/RatingModal';
import { Send, MessageSquare, MapPin, Eye, CheckCircle, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const receiverId = searchParams.get('receiverId');
  const itemId = searchParams.get('itemId');
  const prefilledMessage = searchParams.get('message');

  useEffect(() => {
    if (receiverId) {
      setSelectedConversation(null);
      setMessages([]);
      setIsNewConversation(true);
      setUserHasScrolled(false);
      
      // Pre-fill message if provided in URL
      if (prefilledMessage) {
        setNewMessage(decodeURIComponent(prefilledMessage));
      }
      
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
    if (!userHasScrolled) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, userHasScrolled]);

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setUserHasScrolled(!isAtBottom);
    }
  };

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
    setUserHasScrolled(false);

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
    setUserHasScrolled(false);
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
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Messages</h1>

        <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height: 'calc(100vh - 200px)', maxHeight: '700px' }}>
          <div className="flex h-full">
            {/* Messages List - Left Panel */}
            <div className="w-full sm:w-96 border-r border-gray-200 overflow-y-auto bg-gray-50">
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
                <div className="divide-y divide-gray-200">
                  {conversations.map((conv) => {
                    const otherUser = getOtherParticipant(conv);
                    const isSelected = selectedConversation?.id === conv.id;
                    
                    return (
                      <div
                        key={conv.id}
                        onClick={() => handleConversationSelect(conv)}
                        className={`px-4 py-3 cursor-pointer transition-colors hover:bg-white ${
                          isSelected ? 'bg-white border-l-4 border-green-600' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Circular Avatar/Image */}
                          <div className="flex-shrink-0">
                            {conv.item?.imageURL ? (
                              <img
                                src={conv.item.imageURL}
                                alt={otherUser?.name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                                <User className="h-6 w-6 text-white" />
                              </div>
                            )}
                          </div>

                          {/* Message Info - Single Line */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-2 mb-1">
                              <p className="font-semibold text-gray-900 truncate text-sm">
                                {otherUser?.name}
                              </p>
                              <span className="text-xs text-gray-500 flex-shrink-0">
                                {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                              </span>
                            </div>
                            
                            {/* Item name and last message on same line */}
                            <p className="text-xs text-gray-600 truncate">
                              {conv.item && <span className="font-medium text-green-700">Re: {conv.item.name}</span>}
                              {conv.item && conv.lastMessage && <span className="mx-1">·</span>}
                              {conv.lastMessage && <span>{conv.lastMessage}</span>}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Chat Window - Right Panel */}
            <div className="flex-1 flex flex-col bg-white">
              {selectedConversation || isNewConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                    {selectedConversation ? (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Avatar in header */}
                            {selectedConversation.item?.imageURL ? (
                              <img
                                src={selectedConversation.item.imageURL}
                                alt={getOtherParticipant(selectedConversation)?.name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                                <User className="h-5 w-5 text-white" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-900">
                                {getOtherParticipant(selectedConversation)?.name}
                              </p>
                              {selectedConversation.item && (
                                <p className="text-sm text-gray-600">About: {selectedConversation.item.name}</p>
                              )}
                            </div>
                          </div>
                          
                          {selectedConversation.item && (
                            <div className="flex gap-2">
                              <button
                                onClick={handleRevealAddress}
                                disabled={revealingAddress}
                                className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                              >
                                <Eye className="h-4 w-4" />
                                {revealingAddress ? 'Loading...' : 'Reveal Address'}
                              </button>
                              <button
                                onClick={handleConfirmPickup}
                                disabled={confirmingPickup}
                                className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50"
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

                  {/* Messages Container */}
                  <div 
                    ref={messagesContainerRef} 
                    onScroll={handleScroll} 
                    className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white"
                  >
                    {messages.map((msg) => {
                      const isMyMessage = msg.sender.id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className="flex flex-col max-w-xs lg:max-w-md">
                            <div
                              className={`px-4 py-3 rounded-2xl shadow-sm ${
                                isMyMessage
                                  ? 'bg-green-600 text-white rounded-br-sm'
                                  : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                              }`}
                            >
                              <p className="text-sm leading-relaxed">{msg.message}</p>
                            </div>
                            <p className={`text-xs mt-1 px-2 ${isMyMessage ? 'text-right text-gray-500' : 'text-left text-gray-500'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="px-6 py-4 border-t border-gray-200 bg-white">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        disabled={sendingMessage}
                      />
                      <button
                        type="submit"
                        disabled={sendingMessage || !newMessage.trim()}
                        className="bg-green-600 text-white px-6 py-3 rounded-full hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-md hover:shadow-lg"
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
                <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
                  <div className="text-center px-8">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-10 w-10 text-green-600" />
                    </div>
                    <p className="text-gray-700 font-medium text-lg mb-2">Select a conversation</p>
                    <p className="text-sm text-gray-500">Choose a message from the list to start chatting</p>
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
