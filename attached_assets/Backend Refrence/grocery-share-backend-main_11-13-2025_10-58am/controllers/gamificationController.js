const Badge = require('../models/Badge');
const User = require('../models/User');

// Get all available badges
exports.getAllBadges = async (req, res) => {
  try {
    const badges = await Badge.find().sort({ category: 1, name: 1 });
    res.json({ badges });
  } catch (error) {
    console.error('Error fetching badges:', error);
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
};

// Get user's earned badges
exports.getUserBadges = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate('badges.badge');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      badges: user.badges,
      stats: user.stats
    });
  } catch (error) {
    console.error('Error fetching user badges:', error);
    res.status(500).json({ error: 'Failed to fetch user badges' });
  }
};

// Award badge to user
exports.awardBadge = async (req, res) => {
  try {
    const { userId, badgeId } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user already has this badge
    const hasBadge = user.badges.some(b => b.badge.toString() === badgeId);
    if (hasBadge) {
      return res.status(400).json({ error: 'User already has this badge' });
    }
    
    user.badges.push({ badge: badgeId, earnedAt: new Date() });
    await user.save();
    
    res.json({ message: 'Badge awarded successfully', badges: user.badges });
  } catch (error) {
    console.error('Error awarding badge:', error);
    res.status(500).json({ error: 'Failed to award badge' });
  }
};

// Check and award automatic badges based on user actions
exports.checkAndAwardBadges = async (userId) => {
  try {
    const user = await User.findById(userId).populate('badges.badge');
    if (!user) return;
    
    const allBadges = await Badge.find();
    
    for (const badge of allBadges) {
      const hasBadge = user.badges.some(b => b.badge._id.toString() === badge._id.toString());
      if (hasBadge) continue;
      
      let shouldAward = false;
      
      // Check criteria
      if (badge.criteria === 'first_item' && user.stats.itemsShared >= 1) {
        shouldAward = true;
      } else if (badge.criteria === '5_items' && user.stats.itemsShared >= 5) {
        shouldAward = true;
      } else if (badge.criteria === '10_items' && user.stats.itemsShared >= 10) {
        shouldAward = true;
      } else if (badge.criteria === 'first_rating' && user.ratingCount >= 1) {
        shouldAward = true;
      } else if (badge.criteria === 'top_sharer' && user.stats.itemsShared >= 20) {
        shouldAward = true;
      }
      
      if (shouldAward) {
        user.badges.push({ badge: badge._id, earnedAt: new Date() });
      }
    }
    
    await user.save();
  } catch (error) {
    console.error('Error checking badges:', error);
  }
};

module.exports = exports;
