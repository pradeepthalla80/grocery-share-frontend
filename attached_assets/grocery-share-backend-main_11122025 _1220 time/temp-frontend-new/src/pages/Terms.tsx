import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-green-600 hover:text-green-700 mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Use</h1>
          <p className="text-sm text-gray-500 mb-8">Last Updated: November 4, 2025</p>

          <div className="prose prose-green max-w-none">
            <p className="text-lg font-semibold text-gray-700 mb-6">
              Welcome to Grocery Share! By creating an account or using our app, you agree to the following terms:
            </p>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Purpose</h2>
              <p className="text-gray-700">
                Peer-to-peer platform to share, request, and exchange sealed grocery items within your neighborhood.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Eligibility</h2>
              <p className="text-gray-700">
                18+ only. You're responsible for the accuracy of your information.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Listings & Requests</h2>
              <p className="text-gray-700">
                Only sealed and unexpired grocery items. Remove expired/unavailable items promptly. You may set time limits for availability; expired items may auto-delete.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Pickup & Communication</h2>
              <p className="text-gray-700">
                Pickup is user-coordinated. Address is shared only with mutual consent. Be safe and respectful.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. No Guarantees</h2>
              <p className="text-gray-700">
                We don't guarantee quality or safety. Use your own judgment.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Reviews & Ratings</h2>
              <p className="text-gray-700">
                Use responsibly. One review per transaction.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Termination</h2>
              <p className="text-gray-700">
                We may suspend/remove accounts that abuse the platform or violate terms.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Updates</h2>
              <p className="text-gray-700">
                We may update these terms. Continued use implies agreement.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Contact</h2>
              <p className="text-gray-700">
                Use the Contact Us form or email{' '}
                <a href="mailto:support@groceryshare.app" className="text-green-600 hover:text-green-700 underline">
                  support@groceryshare.app
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
