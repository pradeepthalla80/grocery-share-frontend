import { useState } from 'react';
import { X, Star } from 'lucide-react';
import { createRating } from '../api/ratings';
import { useToast } from '../hooks/useToast';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  rateeId: string;
  rateeName: string;
  itemId?: string;
  conversationId?: string;
  onSuccess?: () => void;
}

export const RatingModal = ({
  isOpen,
  onClose,
  rateeId,
  rateeName,
  itemId,
  conversationId,
  onSuccess
}: RatingModalProps) => {
  const { showToast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      showToast('Please select a rating', 'error');
      return;
    }

    try {
      setLoading(true);
      await createRating({
        ratee: rateeId,
        rating,
        review: review.trim() || undefined,
        item: itemId,
        conversation: conversationId
      });

      showToast('Rating submitted successfully!', 'success');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to submit rating', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Rate {rateeName}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Rating
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm font-medium text-gray-700">
                {rating > 0 ? `${rating} star${rating !== 1 ? 's' : ''}` : 'Select rating'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review (Optional)
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Share your experience..."
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              {review.length}/500 characters
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50"
              disabled={loading || rating === 0}
            >
              {loading ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
