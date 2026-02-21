import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getConversations, getMessages, sendMessage, markMessagesAsRead, confirmPickup, type Conversation, type Message } from '../api/chat';
import { revealAddress } from '../api/address';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { RatingModal } from '../components/RatingModal';
import { Send, MessageSquare, MapPin, Eye, CheckCircle, ChevronDown, ArrowLeft } from 'lucide-react';

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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);
  const lastMessageCountRef = useRef(0);
  const scrollLockRef = useRef(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const prefillAppliedRef = useRef(false);

  const receiverId = searchParams.get('receiverId');
  const itemId = searchParams.get('itemId');
  const prefillMessage = searchParams.get('message');

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (scrollLockRef.current) return;
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    });
  }, []);

  useEffect(() => {
    if (receiverId) {
      setSelectedConversation(null);
      setMessages([]);
      setIsNewConversation(true);
      userScrolledRef.current = false;
      lastMessageCountRef.current = 0;
      prefillAppliedRef.current = false;
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
    if (!prefillAppliedRef.current && prefillMessage && (isNewConversation || selectedConversation)) {
      setNewMessage(prefillMessage);
      prefillAppliedRef.current = true;
    }
  }, [prefillMessage, isNewConversation, selectedConversation]);

  useEffect(() => {
    if (selectedConversation) {
      userScrolledRef.current = false;
      lastMessageCountRef.current = 0;
      fetchMessages(selectedConversation.id);
      markMessagesAsRead(selectedConversation.id);
      
      const interval = setInterval(() => {
        fetchMessages(selectedConversation.id);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  useEffect(() => {
    const newCount = messages.length;
    const hadMessages = lastMessageCountRef.current > 0;
    const hasNewMessages = newCount > lastMessageCountRef.current;
    lastMessageCountRef.current = newCount;

    if (!hadMessages && newCount > 0) {
      scrollToBottom('instant' as ScrollBehavior);
    } else if (hasNewMessages && !userScrolledRef.current) {
      scrollToBottom('smooth');
    }
  }, [messages.length, scrollToBottom]);

  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 80;
      userScrolledRef.current = !isAtBottom;
      setShowScrollButton(!isAtBottom && messages.length > 5);
    }
  }, [messages.length]);

  const fetchConversations = async (selectFirstOrMatch = false) => {
    try {
      const response = await getConversations();
      setConversations(response.conversations);
      
      if (selectFirstOrMatch && response.conversations.length > 0) {
        if (receiverId) {
          let matchingConv;
          if (itemId) {
            matchingConv = response.conversations.find(conv => 
              conv.participants.some(p => p.id === receiverId) && conv.item?.id === itemId
            );
          }
          if (!matchingConv) {
            matchingConv = response.conversations.find(conv => 
              conv.participants.some(p => p.id === receiverId)
            );
          }
          if (matchingConv) {
            setSelectedConversation(matchingConv);
            setIsNewConversation(false);
          }
        } else if (!selectedConversation && window.innerWidth >= 768) {
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
      setMessages(prev => {
        if (prev.length === response.messages.length &&
            prev.length > 0 &&
            prev[prev.length - 1]?.id === response.messages[response.messages.length - 1]?.id) {
          return prev;
        }
        return response.messages;
      });
    } catch (err) {
      showToast('Failed to load messages', 'error');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    userScrolledRef.current = false;

    const otherUser = selectedConversation
      ? selectedConversation.participants.find(p => p.id !== user?.id)
      : null;

    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      message: messageText,
      sender: { id: user?.id || '', name: user?.name || '' },
      receiver: { id: otherUser?.id || receiverId || '', name: otherUser?.name || '' },
      read: false,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      setSendingMessage(true);
      
      if (selectedConversation && otherUser) {
        await sendMessage(otherUser.id, messageText, selectedConversation.item?.id || undefined);
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
        await fetchMessages(selectedConversation.id);
      } else if (isNewConversation && receiverId) {
        await sendMessage(receiverId, messageText, itemId || undefined);
        const response = await getConversations();
        setConversations(response.conversations);
        
        let newConv;
        if (itemId) {
          newConv = response.conversations.find(conv => 
            conv.participants.some(p => p.id === receiverId) && conv.item?.id === itemId
          );
        }
        if (!newConv) {
          newConv = response.conversations.find(conv => 
            conv.participants.some(p => p.id === receiverId)
          );
        }
        if (newConv) {
          setSelectedConversation(newConv);
          setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
          await fetchMessages(newConv.id);
          setIsNewConversation(false);
          navigate('/chat', { replace: true });
        }
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.reason || err.response?.data?.error || 'Failed to send message';
      showToast(errorMsg, 'error');
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
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
    userScrolledRef.current = false;
    lastMessageCountRef.current = 0;
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

  const handleBack = () => {
    setSelectedConversation(null);
    setIsNewConversation(false);
    setRevealedAddress(null);
    if (receiverId) {
      navigate('/chat', { replace: true });
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

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';

    msgs.forEach(msg => {
      const msgDate = new Date(msg.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dateLabel: string;
      if (msgDate.toDateString() === today.toDateString()) {
        dateLabel = 'Today';
      } else if (msgDate.toDateString() === yesterday.toDateString()) {
        dateLabel = 'Yesterday';
      } else {
        dateLabel = msgDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
      }

      if (dateLabel !== currentDate) {
        currentDate = dateLabel;
        groups.push({ date: dateLabel, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  };

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto md:px-4 md:py-8">
        <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-6 px-4 pt-3 md:px-0 md:pt-0">Messages</h1>

        <div className="bg-white md:rounded-2xl md:shadow-sm md:border md:border-gray-100 overflow-hidden" style={{ height: 'calc(100dvh - 10rem - var(--safe-area-bottom, 0px))' }}>
          <div className="flex h-full">
            <div className={`${showConversationList ? 'block w-full' : 'hidden'} md:block md:w-[340px] border-r border-gray-200 overflow-y-auto native-scroll bg-white`}>
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
                <div>
                  {conversations.map((conv, index) => {
                    const otherUser = getOtherParticipant(conv);
                    const isSelected = selectedConversation?.id === conv.id;
                    const unreadCount = conv.unreadCount || 0;
                    return (
                      <div
                        key={conv.id}
                        onClick={() => handleConversationSelect(conv)}
                        className={`relative px-4 py-3.5 cursor-pointer transition-colors active:bg-gray-50 ${
                          isSelected
                            ? 'bg-green-50 border-l-[3px] border-l-green-600'
                            : 'hover:bg-gray-50 border-l-[3px] border-l-transparent'
                        } ${index < conversations.length - 1 ? 'border-b border-gray-100' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {conv.item?.imageURL ? (
                              <img
                                src={conv.item.imageURL}
                                alt={conv.item.name}
                                className="w-11 h-11 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-11 h-11 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                  {otherUser?.name?.charAt(0).toUpperCase() || '?'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`truncate text-sm ${unreadCount > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
                                {otherUser?.name || 'Unknown'}
                              </p>
                              <span className="text-[10px] text-gray-400 flex-shrink-0">
                                {conv.lastMessageAt ? formatTime(conv.lastMessageAt) : ''}
                              </span>
                            </div>
                            {conv.item && (
                              <p className="text-[11px] text-green-600 truncate font-medium">{conv.item.name}</p>
                            )}
                            <div className="flex items-center justify-between gap-2 mt-0.5">
                              <p className={`text-xs truncate ${unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                                {conv.lastMessage || 'No messages yet'}
                              </p>
                              {unreadCount > 0 && (
                                <span className="flex-shrink-0 w-5 h-5 bg-green-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                  {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={`${showChat ? 'flex' : 'hidden'} md:flex flex-1 flex-col`}>
              {selectedConversation || isNewConversation ? (
                <>
                  <div className="px-3 py-2.5 md:px-4 md:py-3 border-b border-gray-200 bg-white">
                    {selectedConversation ? (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <button 
                              onClick={handleBack}
                              className="md:hidden p-1.5 -ml-1 text-gray-500 active:text-gray-700 rounded-lg active:bg-gray-100"
                            >
                              <ArrowLeft className="h-5 w-5" />
                            </button>
                            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {selectedConversation.item?.imageURL ? (
                                <img
                                  src={selectedConversation.item.imageURL}
                                  alt=""
                                  className="w-9 h-9 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                                  <span className="text-white font-bold text-xs">
                                    {getOtherParticipant(selectedConversation)?.name?.charAt(0).toUpperCase() || '?'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 text-sm truncate">
                                {getOtherParticipant(selectedConversation)?.name}
                              </p>
                              {selectedConversation.item && (
                                <p className="text-[11px] text-green-600 truncate font-medium">{selectedConversation.item.name}</p>
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
                      <div className="flex items-center gap-2.5">
                        <button 
                          onClick={handleBack}
                          className="md:hidden p-1.5 -ml-1 text-gray-500 active:text-gray-700 rounded-lg active:bg-gray-100"
                        >
                          <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Send className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">New Conversation</p>
                          <p className="text-[11px] text-gray-400">Send your first message</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative flex-1 bg-[#f0f2f5]">
                    <div ref={messagesContainerRef} onScroll={handleScroll} className="absolute inset-0 overflow-y-auto px-3 py-4 md:px-4 native-scroll flex flex-col">
                      <div className="flex-1 min-h-0" />
                      <div className="space-y-1">
                        {groupMessagesByDate(messages).map((group) => (
                          <div key={group.date}>
                            <div className="flex justify-center my-3">
                              <span className="bg-white/90 text-gray-500 text-[10px] font-medium px-3 py-1 rounded-full shadow-sm border border-gray-100">
                                {group.date}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {group.messages.map((msg, idx) => {
                                const isMyMessage = msg.sender.id === user?.id;
                                const isTemp = msg.id.startsWith('temp-');
                                const prevMsg = idx > 0 ? group.messages[idx - 1] : null;
                                const sameSenderAsPrev = prevMsg && prevMsg.sender.id === msg.sender.id;
                                return (
                                  <div
                                    key={msg.id}
                                    className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} ${sameSenderAsPrev ? '' : 'mt-2'}`}
                                  >
                                    <div
                                      className={`max-w-[78%] md:max-w-xs lg:max-w-md px-3 py-1.5 shadow-sm ${
                                        isMyMessage
                                          ? `bg-green-600 text-white ${sameSenderAsPrev ? 'rounded-2xl rounded-tr-md' : 'rounded-2xl rounded-br-md'}`
                                          : `bg-white text-gray-900 ${sameSenderAsPrev ? 'rounded-2xl rounded-tl-md' : 'rounded-2xl rounded-bl-md'}`
                                      } ${isTemp ? 'opacity-70' : ''}`}
                                    >
                                      <p className="text-[13px] leading-relaxed break-words whitespace-pre-wrap">{msg.message}</p>
                                      <div className={`flex items-center gap-1 justify-end mt-0.5 ${isMyMessage ? '' : ''}`}>
                                        <p className={`text-[9px] ${isMyMessage ? 'text-green-200' : 'text-gray-400'}`}>
                                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        {isMyMessage && msg.read && (
                                          <CheckCircle className="h-2.5 w-2.5 text-green-200" />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    </div>
                    {showScrollButton && (
                      <button
                        onClick={() => { userScrolledRef.current = false; setShowScrollButton(false); scrollToBottom('smooth'); }}
                        className="absolute bottom-3 right-3 w-8 h-8 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform z-10 animate-scale-in"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSendMessage} className="px-3 py-2 md:px-4 md:py-3 bg-[#f0f2f5] border-t border-gray-100">
                    <div className="flex gap-2.5 items-center">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="w-full px-4 py-2.5 rounded-2xl bg-white border-none shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-green-400 placeholder:text-gray-400"
                          disabled={sendingMessage}
                          autoFocus
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={sendingMessage || !newMessage.trim()}
                        className="w-10 h-10 flex items-center justify-center bg-green-600 text-white rounded-full shadow-md hover:bg-green-700 transition-all disabled:opacity-30 disabled:shadow-none flex-shrink-0 active:scale-90"
                      >
                        {sendingMessage ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Send className="h-4 w-4 ml-0.5" />
                        )}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-[#f0f2f5]">
                  <div className="text-center px-8">
                    <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
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
