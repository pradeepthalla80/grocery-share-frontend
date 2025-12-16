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
          <p className="text-sm text-gray-500 mb-8">Last Updated: December 16, 2025</p>

          <div className="prose prose-green max-w-none">
            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Data We Collect</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Name, email, login credentials (hashed)</li>
                <li>Location (zip code, optional address)</li>
                <li>Listings, messages, ratings</li>
                <li>Store terms acceptance, timestamps, IP address</li>
                <li>Transaction metadata (no card details)</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Data</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Operate the platform</li>
                <li>Enable communication and payments</li>
                <li>Prevent fraud and abuse</li>
                <li>Improve service quality</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Data Visibility</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Address shared only after mutual consent</li>
                <li>Admin access limited to support and compliance</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Payments</h2>
              <p className="text-gray-700">
                Payments are handled by Stripe. Grocery Share does not store payment card data.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Retention</h2>
              <p className="text-gray-700">
                Some records (transactions, consent logs) may be retained for legal and compliance purposes even after account deletion.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Third Parties</h2>
              <p className="text-gray-700 mb-2">We use:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Stripe (payments)</li>
                <li>Google Maps (location)</li>
                <li>Cloud services (hosting)</li>
              </ul>
              <p className="text-gray-700 mt-2">Each has its own privacy policy.</p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Security</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>HTTPS enforced</li>
                <li>Encrypted authentication</li>
                <li>Industry-standard protections</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Policy Updates</h2>
              <p className="text-gray-700">
                Major changes will be communicated via app or email.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Contact</h2>
              <p className="text-gray-700">
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
