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
          <p className="text-sm text-gray-500 mb-8">Last Updated: December 16, 2025</p>

          <div className="prose prose-green max-w-none">
            <p className="text-lg font-semibold text-gray-700 mb-6">
              Welcome to Grocery Share (BaskMate). By creating an account or using the platform, you agree to these Terms.
            </p>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Platform Purpose</h2>
              <p className="text-gray-700">
                Grocery Share is a peer-to-peer marketplace that enables users to list, request, share, or sell grocery items locally. We do not sell, inspect, store, or deliver items ourselves.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Eligibility</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>You must be 18 years or older</li>
                <li>You are responsible for ensuring your participation complies with local laws</li>
                <li>Store owners are responsible for any permits or licenses required in their jurisdiction</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Listings & Requests</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Only sealed, labeled, and unexpired items may be listed</li>
                <li>Users must ensure accuracy of item descriptions, expiry dates, and pricing</li>
                <li>Grocery Share may remove listings that violate guidelines</li>
                <li>Store items may include pricing and stock quantity</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Store Owner Mode</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Store owners operate as independent sellers</li>
                <li>Grocery Share does not verify food quality, legality, or seller compliance</li>
                <li>Store owners agree to separate Store Terms & Agreement</li>
                <li>Acceptance of store terms is logged with timestamp and IP address</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Payments & Fees</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Payments are processed via Stripe</li>
                <li>Grocery Share does not store credit card information</li>
                <li>A platform service fee may be deducted per transaction</li>
                <li>Refunds and disputes are subject to seller policies and Stripe rules</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Pickup & Communication</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Pickup is arranged directly between users</li>
                <li>Addresses are shared only with mutual consent</li>
                <li>Users are responsible for personal safety during exchanges</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. No Guarantees & Food Disclaimer</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Grocery Share makes no guarantees about item safety, quality, freshness, or legality</li>
                <li>Users assume all risk associated with consuming or handling items</li>
                <li>Grocery Share is not liable for illness, damage, or loss</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Reviews & Ratings</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>One rating per transaction</li>
                <li>False or abusive reviews may be removed</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Account Suspension</h2>
              <p className="text-gray-700 mb-2">We may suspend or terminate accounts for:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Fraud</li>
                <li>Abuse</li>
                <li>Policy violations</li>
                <li>Illegal activity</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Limitation of Liability</h2>
              <p className="text-gray-700 mb-2">To the maximum extent permitted by law, Grocery Share is not liable for:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Personal injury</li>
                <li>Food-related illness</li>
                <li>Financial loss</li>
                <li>Disputes between users</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Indemnification</h2>
              <p className="text-gray-700">
                You agree to indemnify and hold harmless Grocery Share and its owners from any claims arising from your use of the platform.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Governing Law</h2>
              <p className="text-gray-700">
                These Terms are governed by the laws of the State of Illinois, USA.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Changes</h2>
              <p className="text-gray-700">
                We may update these Terms. Continued use means acceptance.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Contact</h2>
              <p className="text-gray-700">
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
