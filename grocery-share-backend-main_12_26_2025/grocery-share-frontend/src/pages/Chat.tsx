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
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const receiverId = searchParams.get('receiverId');
  const itemId = searchParams.get('itemId');

  useEffect(() => {
    if (receiverId) {
      setSelectedConversation(null);
      setMessages([]);
      setIsNewConversation(true);
      setUserHasScrolled(false); // Reset scroll state for new conversation
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
    // Only auto-scroll if user hasn't manually scrolled up
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
    setUserHasScrolled(false); // Reset scroll state to auto-scroll to new message

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
    setUserHasScrolled(false); // Reset scroll state to show latest messages
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

  const showConversationList = !selectedConversation && !isNewConversation;
  const showChat = selectedConversation || isNewConversation;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto md:px-4 md:py-8">
        <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6 px-4 pt-4 md:px-0 md:pt-0">Messages</h1>

        <div className="bg-white md:rounded-lg md:shadow-md overflow-hidden" style={{ height: 'calc(100dvh - 8rem)' }}>
          <div className="flex h-full">
            <div className={`${showConversationList ? 'block w-full' : 'hidden'} md:block md:w-1/3 border-r border-gray-200 overflow-y-auto native-scroll`}>
              {conversations.length === 0 && !isNewConversation ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <MessageSquare className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="text-gray-600 font-medium mb-1">No conversations yet</p>
                  <p className="text-sm text-gray-400 mb-4">Find an item and contact the seller</p>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-green-600 text-white px-5 py-2.5 rounded-xl hover:bg-green-700 transition text-sm font-medium active:scale-[0.98]"
                  >
                    Browse Items
                  </button>
                </div>
              ) : conversations.length === 0 && isNewConversation ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <MessageSquare className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="text-gray-700 font-medium">New Conversation</p>
                  <p className="text-sm text-gray-500 mt-1">Send a message to start chatting!</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const otherUser = getOtherParticipant(conv);
                  return (
                    <div
                      key={conv.id}
                      onClick={() => handleConversationSelect(conv)}
                      className={`p-3.5 md:p-4 border-b border-gray-100 cursor-pointer active:bg-gray-50 transition touch-ripple ${
                        selectedConversation?.id === conv.id ? 'bg-green-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          {conv.item?.imageURL ? (
                            <img
                              src={conv.item.imageURL}
                              alt={conv.item.name}
                              className="w-11 h-11 rounded-full object-cover"
                            />
                          ) : (
                            <MessageSquare className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate text-sm">{otherUser?.name}</p>
                          {conv.item && (
                            <p className="text-[11px] text-gray-500 truncate">Re: {conv.item.name}</p>
                          )}
                          <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className={`${showChat ? 'flex' : 'hidden'} md:flex flex-1 flex-col`}>
              {selectedConversation || isNewConversation ? (
                <>
                  <div className="p-3 md:p-4 border-b border-gray-200 bg-white">
                    {selectedConversation ? (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <button 
                              onClick={() => { setSelectedConversation(null); setIsNewConversation(false); }}
                              className="md:hidden p-1 text-gray-500 active:text-gray-700"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 text-sm truncate">
                                {getOtherParticipant(selectedConversation)?.name}
                              </p>
                              {selectedConversation.item && (
                                <p className="text-xs text-gray-500 truncate">{selectedConversation.item.name}</p>
                              )}
                            </div>
                          </div>
                          {selectedConversation.item && (
                            <div className="flex gap-1.5 flex-shrink-0">
                              <button
                                onClick={handleRevealAddress}
                                disabled={revealingAddress}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 active:scale-95"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span className="hidden md:inline">{revealingAddress ? 'Loading...' : 'Address'}</span>
                              </button>
                              <button
                                onClick={handleConfirmPickup}
                                disabled={confirmingPickup}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 active:scale-95"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span className="hidden md:inline">{confirmingPickup ? 'Loading...' : 'Pickup'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                        {revealedAddress && (
                          <div className="mt-2 p-2.5 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-green-700">{revealedAddress}</p>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => { setSelectedConversation(null); setIsNewConversation(false); }}
                          className="md:hidden p-1 text-gray-500"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <p className="font-semibold text-gray-900 text-sm">New Conversation</p>
                      </div>
                    )}
                  </div>

                  <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 bg-gray-50 native-scroll">
                    {messages.map((msg) => {
                      const isMyMessage = msg.sender.id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] md:max-w-xs lg:max-w-md px-3.5 py-2 rounded-2xl ${
                              isMyMessage
                                ? 'bg-green-600 text-white rounded-br-md'
                                : 'bg-white text-gray-900 border border-gray-100 rounded-bl-md'
                            }`}
                          >
                            <p className="text-sm">{msg.message}</p>
                            <p className={`text-[10px] mt-0.5 ${isMyMessage ? 'text-green-200' : 'text-gray-400'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={handleSendMessage} className="p-3 md:p-4 border-t border-gray-200 bg-white safe-area-bottom">
                    <div className="flex gap-2 items-end">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-gray-50"
                        disabled={sendingMessage}
                      />
                      <button
                        type="submit"
                        disabled={sendingMessage || !newMessage.trim()}
                        className="bg-green-600 text-white p-2.5 rounded-full hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 active:scale-90"
                      >
                        {sendingMessage ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center px-8">
                    <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <MessageSquare className="h-10 w-10 text-gray-300" />
                    </div>
                    <p className="text-gray-600 font-medium mb-1">Select a conversation</p>
                    <p className="text-sm text-gray-400">Or browse items to contact a seller</p>
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
