import { useState, useEffect } from 'react';
import { loadStripe, type StripeElementsOptions } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, CreditCard, AlertCircle } from 'lucide-react';
import { createPaymentIntent, confirmPayment, getStripePublishableKey } from '../api/payment';
import { useToast } from '../hooks/useToast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemName: string;
  itemPrice: number;
  offerDelivery?: boolean;
  deliveryFee?: number;
  onSuccess: () => void;
}

const CheckoutForm = ({ 
  itemName, 
  itemPrice,
  offerDelivery,
  deliveryFee,
  onSuccess, 
  onClose,
  onDeliveryChange
}: { 
  itemName: string; 
  itemPrice: number;
  offerDelivery?: boolean;
  deliveryFee?: number;
  onSuccess: () => void;
  onClose: () => void;
  onDeliveryChange: (includeDelivery: boolean) => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeDelivery, setIncludeDelivery] = useState(false);

  const totalPrice = includeDelivery && deliveryFee ? itemPrice + deliveryFee : itemPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/dashboard',
        },
        redirect: 'if_required',
      });

      if (submitError) {
        setError(submitError.message || 'Payment failed');
        showToast(submitError.message || 'Payment failed', 'error');
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        try {
          await confirmPayment(paymentIntent.id);
          showToast('Payment successful! Item purchased.', 'success');
          onSuccess();
          onClose();
        } catch (confirmError: any) {
          console.error('Failed to confirm payment on backend:', confirmError);
          setError('Payment processed but confirmation failed. Please contact support.');
          showToast('Payment confirmation failed', 'error');
        }
      } else {
        setError('Payment was not completed');
        showToast('Payment was not completed', 'error');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      showToast('Payment failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeliveryToggle = (checked: boolean) => {
    setIncludeDelivery(checked);
    onDeliveryChange(checked);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-3">Purchase Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm sm:text-base">
            <span className="text-gray-600">{itemName}</span>
            <span className="font-medium text-gray-900">${itemPrice.toFixed(2)}</span>
          </div>
          
          {offerDelivery && (
            <>
              <div className="border-t pt-2">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={includeDelivery}
                      onChange={(e) => handleDeliveryToggle(e.target.checked)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="text-sm sm:text-base text-gray-700 group-hover:text-gray-900">
                      🚚 Add Delivery
                    </span>
                  </div>
                  <span className="text-sm sm:text-base font-medium text-gray-900">
                    {deliveryFee && deliveryFee > 0 ? `$${deliveryFee.toFixed(2)}` : 'FREE'}
                  </span>
                </label>
              </div>
            </>
          )}
          
          <div className="border-t pt-2 flex justify-between items-center">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="text-xl sm:text-2xl font-bold text-green-600">${totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <PaymentElement />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5" />
              Pay ${totalPrice.toFixed(2)}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export const PaymentModal = ({
  isOpen,
  onClose,
  itemId,
  itemName,
  itemPrice,
  offerDelivery,
  deliveryFee,
  onSuccess,
}: PaymentModalProps) => {
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeDelivery, setIncludeDelivery] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const initStripe = async () => {
      try {
        const { publishableKey } = await getStripePublishableKey();
        if (publishableKey) {
          setStripePromise(loadStripe(publishableKey));
        } else {
          setError('Stripe configuration missing');
        }
      } catch (err) {
        console.error('Failed to load Stripe:', err);
        setError('Failed to initialize payment system');
      }
    };

    if (isOpen) {
      initStripe();
    }
  }, [isOpen]);

  useEffect(() => {
    const createIntent = async () => {
      if (!isOpen || !stripePromise) return;

      setLoading(true);
      setError(null);

      try {
        const { clientSecret: secret } = await createPaymentIntent(itemId, includeDelivery);
        setClientSecret(secret);
      } catch (err: any) {
        console.error('Failed to create payment intent:', err);
        setError(err.response?.data?.error || 'Failed to initialize payment');
        showToast('Failed to initialize payment', 'error');
      } finally {
        setLoading(false);
      }
    };

    createIntent();
  }, [isOpen, itemId, includeDelivery, stripePromise, showToast]);

  const handleDeliveryChange = (newIncludeDelivery: boolean) => {
    setIncludeDelivery(newIncludeDelivery);
  };

  if (!isOpen) return null;

  const options: StripeElementsOptions = {
    clientSecret: clientSecret || undefined,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#16a34a',
      },
    },
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-green-600" />
            Secure Checkout
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
            <p className="text-gray-600">Preparing payment...</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-red-600 text-center mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Close
            </button>
          </div>
        )}

        {!loading && !error && clientSecret && stripePromise && (
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm
              itemName={itemName}
              itemPrice={itemPrice}
              offerDelivery={offerDelivery}
              deliveryFee={deliveryFee}
              onSuccess={onSuccess}
              onClose={onClose}
              onDeliveryChange={handleDeliveryChange}
            />
          </Elements>
        )}
      </div>
    </div>
  );
};
