import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getConversations, type Conversation } from '../api/chat';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ConversationCard } from '../components/ConversationCard';
import { ChatModal } from '../components/ChatModal';
import { StoreOwnerPromo } from '../components/StoreOwnerPromo';
import { MessageSquare } from 'lucide-react';

export const Chat = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const receiverId = searchParams.get('receiverId');
  const itemId = searchParams.get('itemId');
  const prefilledMessage = searchParams.get('message');

  useEffect(() => {
    fetchConversations();
    
    const interval = setInterval(() => {
      if (!showModal) {
        fetchConversations();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [showModal]);

  useEffect(() => {
    if (receiverId) {
      const matchingConv = conversations.find(conv => 
        conv.participants.some(p => p.id === receiverId)
      );
      
      if (matchingConv) {
        setSelectedConversation(matchingConv);
      } else {
        setSelectedConversation(null);
      }
      setShowModal(true);
    }
  }, [receiverId, conversations]);

  const fetchConversations = async () => {
    try {
      const response = await getConversations();
      setConversations(response.conversations);
    } catch (err) {
      showToast('Failed to load conversations', 'error');
    } finally {
      if (initialLoad) setInitialLoad(false);
    }
  };

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedConversation(null);
    if (receiverId) {
      navigate('/chat', { replace: true });
    }
  };

  const handleConversationCreated = async (receiverId: string) => {
    try {
      const response = await getConversations();
      setConversations(response.conversations);
      
      const matchingConv = response.conversations.find(conv => 
        conv.participants.some(p => p.id === receiverId)
      );
      
      if (matchingConv) {
        setSelectedConversation(matchingConv);
      }
      
      navigate('/chat', { replace: true });
    } catch (err) {
      showToast('Failed to load conversation', 'error');
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-1">Connect with buyers and sellers in your community</p>
        </div>

        {/* Store Owner Promotional Banner */}
        <div className="mb-8">
          <StoreOwnerPromo />
        </div>

        {conversations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-10 w-10 text-blue-600" />
            </div>
            <p className="text-gray-700 font-medium text-lg mb-2">No conversations yet</p>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              To start a conversation, find an item you're interested in and click "Contact Seller"
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Browse Items
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {conversations.map((conversation) => (
              <ConversationCard
                key={conversation.id}
                conversation={conversation}
                currentUserId={user?.id || ''}
                onClick={() => handleConversationClick(conversation)}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <ChatModal
          conversation={selectedConversation}
          currentUserId={user?.id || ''}
          receiverId={receiverId || undefined}
          itemId={itemId || undefined}
          prefilledMessage={prefilledMessage || undefined}
          isNewConversation={!selectedConversation && !!receiverId}
          onClose={handleCloseModal}
          onConversationCreated={handleConversationCreated}
        />
      )}
    </div>
  );
};
