const Item = require('../models/Item');
const SearchLog = require('../models/SearchLog');

// Get recommendations for user
const getRecommendations = async (req, res) => {
  try {
    const { lat, lng, limit = 10 } = req.query;
    
    // Get user's search history for personalization
    const userSearches = await SearchLog.find({ user: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Extract common tags and categories from search history
    const tags = [];
    const categories = [];
    
    userSearches.forEach(search => {
      if (search.keyword) tags.push(search.keyword);
      if (search.category) categories.push(search.category);
      if (search.tags) tags.push(...search.tags);
    });
    
    // Build query based on user preferences
    const query = {};
    
    // Location-based if provided
    if (lat && lng) {
      const radiusInMeters = 10 * 1609.34; // 10 miles
      query.location = {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radiusInMeters
        }
      };
    }
    
    // Tag/category matching
    if (tags.length > 0 || categories.length > 0) {
      query.$or = [];
      if (tags.length > 0) {
        query.$or.push({ tags: { $in: tags } });
      }
      if (categories.length > 0) {
        query.$or.push({ category: { $in: categories } });
      }
    }
    
    // Get recommended items
    const items = await Item.find(query)
      .populate('user', 'name email')
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    // Format response
    const formattedItems = items.map(item => ({
      id: item._id,
      name: item.name,
      imageURL: item.imageURL,
      images: item.images || [],
      category: item.category,
      tags: item.tags,
      expiryDate: item.expiryDate,
      price: item.price,
      isFree: item.isFree,
      pickupTimeStart: item.pickupTimeStart,
      pickupTimeEnd: item.pickupTimeEnd,
      flexiblePickup: item.flexiblePickup,
      location: {
        lat: item.location.coordinates[1],
        lng: item.location.coordinates[0]
      },
      user: item.user ? {
        id: item.user._id,
        name: item.user.name,
        email: item.user.email
      } : null,
      createdAt: item.createdAt
    }));
    
    res.json({
      count: formattedItems.length,
      items: formattedItems
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
};

// Get trending items
const getTrending = async (req, res) => {
  try {
    const { lat, lng, limit = 10 } = req.query;
    
    // Get most searched items from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const popularSearches = await SearchLog.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: '$keyword', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    const keywords = popularSearches.map(s => s._id).filter(Boolean);
    
    const query = {};
    if (keywords.length > 0) {
      query.$or = [
        { name: { $in: keywords.map(k => new RegExp(k, 'i')) } },
        { tags: { $in: keywords } },
        { category: { $in: keywords } }
      ];
    }
    
    // Location-based if provided
    if (lat && lng) {
      const radiusInMeters = 25 * 1609.34; // 25 miles for trending
      query.location = {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radiusInMeters
        }
      };
    }
    
    const items = await Item.find(query)
      .populate('user', 'name email')
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const formattedItems = items.map(item => ({
      id: item._id,
      name: item.name,
      imageURL: item.imageURL,
      images: item.images || [],
      category: item.category,
      tags: item.tags,
      expiryDate: item.expiryDate,
      price: item.price,
      isFree: item.isFree,
      pickupTimeStart: item.pickupTimeStart,
      pickupTimeEnd: item.pickupTimeEnd,
      flexiblePickup: item.flexiblePickup,
      location: {
        lat: item.location.coordinates[1],
        lng: item.location.coordinates[0]
      },
      user: item.user ? {
        id: item.user._id,
        name: item.user.name,
        email: item.user.email
      } : null,
      createdAt: item.createdAt
    }));
    
    res.json({
      count: formattedItems.length,
      items: formattedItems
    });
  } catch (error) {
    console.error('Get trending error:', error);
    res.status(500).json({ error: 'Failed to fetch trending items' });
  }
};

module.exports = {
  getRecommendations,
  getTrending
};
