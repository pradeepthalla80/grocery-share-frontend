export const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms and Conditions</h1>
          
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-4">
              <strong>Last Updated:</strong> November 2025
            </p>

            <section className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-700">
                By accessing and using Grocery Share, you accept and agree to be bound by the terms and conditions of this agreement. If you do not agree to these terms, please do not use our platform.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
              <p className="text-gray-700">
                Grocery Share is a peer-to-peer platform that connects users who want to share surplus grocery items. The platform facilitates listing items, searching for available groceries, and connecting buyers and sellers.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. User Responsibilities</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>You must provide accurate and complete information when creating an account</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You must ensure all listed items are safe for consumption and accurately described</li>
                <li>You agree to meet safety guidelines when exchanging items with other users</li>
                <li>You will not use the platform for any illegal or unauthorized purpose</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. Item Listings</h2>
              <p className="text-gray-700">
                Users who list items for sale or donation are solely responsible for the accuracy of their listings, including descriptions, images, expiration dates, and pickup information. Grocery Share does not verify the quality or safety of listed items.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. Payments and Transactions</h2>
              <p className="text-gray-700">
                Transactions between users may be processed through our payment provider (Stripe). We are not responsible for any disputes arising from transactions. Users agree to resolve payment disputes directly with each other or through the payment provider.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">6. Privacy</h2>
              <p className="text-gray-700">
                Your privacy is important to us. We collect and process personal information in accordance with our Privacy Policy. By using Grocery Share, you consent to the collection and use of your data as described.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. Limitation of Liability</h2>
              <p className="text-gray-700">
                Grocery Share is provided "as is" without warranties of any kind. We are not liable for any damages resulting from your use of the platform, including but not limited to health issues from consumed items, theft, fraud, or disputes between users.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. Account Termination</h2>
              <p className="text-gray-700">
                We reserve the right to suspend or terminate accounts that violate these terms. Users may delete their accounts at any time through their profile settings.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">9. Changes to Terms</h2>
              <p className="text-gray-700">
                We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">10. Contact Information</h2>
              <p className="text-gray-700">
                If you have questions about these terms, please contact us through our Contact Us page.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
