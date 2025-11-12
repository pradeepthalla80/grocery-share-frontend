const User = require('../models/User');
const Item = require('../models/Item');
const ItemRequest = require('../models/ItemRequest');

// GET /api/v1/analytics/impact
exports.getImpactAnalytics = async (req, res) => {
  try {
    // Count total users
    const totalUsers = await User.countDocuments();
    
    // Count total items shared
    const totalItems = await Item.countDocuments();
    
    // Count total requests
    const totalRequests = await ItemRequest.countDocuments();
    
    // Count successful shares (items with status 'completed' or 'pickedup')
    const successfulShares = await Item.countDocuments({ 
      status: { $in: ['completed', 'pickedup'] } 
    });
    
    // Estimate food saved (average 2.3 lbs per item shared)
    const foodSavedLbs = Math.round(successfulShares * 2.3);
    
    // Count active communities (unique cities from users)
    const activeCommunities = await User.distinct('city').then(cities => cities.length);
    
    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalItems,
        totalRequests,
        foodSavedLbs,
        activeCommunities,
        successfulShares
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics data'
    });
  }
};
