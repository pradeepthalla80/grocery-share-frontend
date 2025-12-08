const User = require('../models/User');
const Item = require('../models/Item');
const StoreAgreement = require('../models/StoreAgreement');

// Store Owner Terms & Agreement (v1.0)
const STORE_TERMS_V1 = `
GROCERY SHARE STORE OWNER TERMS & AGREEMENT

Last Updated: ${new Date().toISOString().split('T')[0]}
Version: 1.0

By activating Store Mode, you ("Store Owner") agree to the following terms and conditions:

1. SELLER RESPONSIBILITIES
   • You are solely responsible for compliance with all applicable local, state, and federal laws regarding food sales, business licensing, and health regulations.
   • You must obtain any required permits, licenses, or certifications to sell food items in your jurisdiction.
   • You are responsible for accurate product descriptions, pricing, and stock availability.

2. PLATFORM LIABILITY
   • Grocery Share is a platform connecting buyers and sellers and is not responsible for:
     - Product quality, safety, or fitness for consumption
     - Order fulfillment, delivery, or customer satisfaction
     - Disputes between buyers and sellers
     - Compliance with local laws and regulations

3. PRODUCT LISTING REQUIREMENTS
   • All listings must accurately represent the product (description, images, quantity, price).
   • Stock levels must be kept current; out-of-stock items will be automatically hidden.
   • Pricing must be fair and comply with applicable price gouging laws.
   • Food items must comply with all safety and labeling requirements.

4. PAYMENT AND FEES
   • Payments are processed through Stripe. By using Store Mode, you agree to Stripe's Terms of Service.
   • Grocery Share does not charge platform fees at this time (subject to change with 30 days notice).
   • You are responsible for all applicable taxes, including sales tax and income tax.

5. PROHIBITED CONDUCT
   • Selling counterfeit, stolen, or illegal items
   • Fraudulent listings or deceptive practices
   • Harassment of buyers or platform users
   • Violation of health, safety, or food regulations

6. ACCOUNT SUSPENSION
   • Grocery Share reserves the right to suspend or terminate Store Mode access for:
     - Violation of these terms
     - Fraudulent activity or illegal conduct
     - Repeated customer complaints
     - Health or safety violations

7. TAX OBLIGATIONS
   • You are responsible for reporting all income and paying applicable taxes.
   • You must provide accurate tax information when required.
   • Grocery Share may report transaction data to tax authorities as required by law.

8. MODIFICATIONS TO TERMS
   • Grocery Share may update these terms at any time.
   • Continued use of Store Mode after changes constitutes acceptance.
   • Material changes will be notified via email or platform notification.

9. DATA AND PRIVACY
   • Your store activity, sales data, and customer interactions may be collected for platform improvement and legal compliance.
   • Customer data must be used only for order fulfillment and not shared with third parties.

10. INDEMNIFICATION
    • You agree to indemnify and hold harmless Grocery Share from any claims, damages, or losses arising from your use of Store Mode.

By clicking "I Accept," you acknowledge that you have read, understood, and agree to be bound by these terms.
`;

// Get Store Owner Terms
exports.getStoreTerms = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        version: '1.0',
        terms: STORE_TERMS_V1,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching store terms:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching store terms',
      error: error.message
    });
  }
};

// Activate Store Mode (requires agreement acceptance)
exports.activateStoreMode = async (req, res) => {
  try {
    const { storeName, acceptTerms } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!acceptTerms) {
      return res.status(400).json({
        success: false,
        message: 'You must accept the Store Owner Terms & Agreement'
      });
    }

    if (!storeName || storeName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Store name must be at least 2 characters'
      });
    }

    // Get user's IP address
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';

    // Check if user already has an agreement
    let agreement = await StoreAgreement.findOne({ user: userId });

    if (!agreement) {
      // Create new agreement
      agreement = await StoreAgreement.create({
        user: userId,
        ipAddress,
        version: '1.0',
        termsContent: STORE_TERMS_V1,
        accepted: true,
        agreedAt: new Date()
      });
    }

    // Update user to activate store mode
    const user = await User.findByIdAndUpdate(
      userId,
      {
        isStoreOwner: true,
        storeMode: true,
        storeName: storeName.trim(),
        storeAgreementAccepted: true,
        storeActivatedAt: new Date()
      },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Store Mode activated successfully',
      data: {
        user,
        agreement: {
          version: agreement.version,
          agreedAt: agreement.agreedAt
        }
      }
    });

  } catch (error) {
    console.error('Error activating store mode:', error);
    res.status(500).json({
      success: false,
      message: 'Error activating store mode',
      error: error.message
    });
  }
};

// Toggle Store Mode on/off
exports.toggleStoreMode = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user.isStoreOwner) {
      return res.status(403).json({
        success: false,
        message: 'Store Mode not activated. Please activate first.'
      });
    }

    // Toggle the mode
    user.storeMode = !user.storeMode;
    await user.save();

    res.json({
      success: true,
      message: `Store Mode ${user.storeMode ? 'enabled' : 'disabled'}`,
      data: {
        storeMode: user.storeMode
      }
    });

  } catch (error) {
    console.error('Error toggling store mode:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling store mode',
      error: error.message
    });
  }
};

// Get store owner's items
exports.getMyStoreItems = async (req, res) => {
  try {
    const userId = req.user._id;

    const items = await Item.find({
      user: userId,
      isStoreItem: true
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: items.length,
      data: items
    });

  } catch (error) {
    console.error('Error fetching store items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching store items',
      error: error.message
    });
  }
};

// Get store owner's transaction summary
// Note: Full Stripe transaction viewing requires Stripe API integration
exports.getStoreTransactions = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all sold store items
    const soldItems = await Item.find({
      user: userId,
      isStoreItem: true,
      status: 'sold'
    }).select('name price buyerId createdAt updatedAt');

    // Calculate totals
    const totalRevenue = soldItems.reduce((sum, item) => sum + (item.price || 0), 0);

    res.json({
      success: true,
      data: {
        totalSales: soldItems.length,
        totalRevenue,
        recentTransactions: soldItems.slice(0, 20) // Last 20 transactions
      }
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: error.message
    });
  }
};

// Get user's store agreement
exports.getMyAgreement = async (req, res) => {
  try {
    const userId = req.user._id;

    const agreement = await StoreAgreement.findOne({ user: userId });

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: 'No agreement found'
      });
    }

    res.json({
      success: true,
      data: agreement
    });

  } catch (error) {
    console.error('Error fetching agreement:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching agreement',
      error: error.message
    });
  }
};
