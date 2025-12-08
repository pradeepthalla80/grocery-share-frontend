import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last Updated: November 4, 2025</p>

          <div className="prose prose-green max-w-none">
            <p className="text-lg font-semibold text-gray-700 mb-6">
              Your privacy is important to us. Here's how we handle your data:
            </p>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Data We Collect</h2>
              <p className="text-gray-700">
                Name, email, password or Google ID, zip code (and optional address), listings, messages, reviews, activity logs.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use It</h2>
              <p className="text-gray-700">
                To connect users, display listings/requests, enable chat, and improve service.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Who Can See It</h2>
              <p className="text-gray-700">
                Address is private and only revealed with consent. Support team may access logs for issue resolution.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Account Deletion</h2>
              <p className="text-gray-700">
                You may delete your account at any time. All associated data will be removed permanently.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Security</h2>
              <p className="text-gray-700">
                Passwords hashed, tokens encrypted, HTTPS enforced. Stripe handles payments (we don't store cards).
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Third Parties</h2>
              <p className="text-gray-700">
                We may use services like Stripe, Google Maps, Firebase — subject to their own data policies.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Policy Changes</h2>
              <p className="text-gray-700">
                We'll notify users of major updates.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Contact</h2>
              <p className="text-gray-700">
                For questions, email{' '}
                <a href="mailto:privacy@groceryshare.app" className="text-green-600 hover:text-green-700 underline">
                  privacy@groceryshare.app
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
