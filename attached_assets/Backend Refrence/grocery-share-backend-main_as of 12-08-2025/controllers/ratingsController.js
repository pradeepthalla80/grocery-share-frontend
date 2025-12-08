const Rating = require('../models/Rating');
const User = require('../models/User');

// Create a new rating
exports.createRating = async (req, res) => {
  try {
    const { ratee, rating, review, item, conversation } = req.body;
    const rater = req.user._id;

    // Prevent self-rating
    if (rater.toString() === ratee) {
      return res.status(400).json({ error: 'You cannot rate yourself' });
    }

    // Check if rating already exists for this combination
    const existingRating = await Rating.findOne({
      rater,
      ratee,
      ...(item && { item })
    });

    if (existingRating) {
      return res.status(400).json({ error: 'You have already rated this user for this transaction' });
    }

    // Create the rating
    const newRating = new Rating({
      rater,
      ratee,
      rating,
      review,
      item,
      conversation
    });

    await newRating.save();

    // Update ratee's average rating
    await updateUserRating(ratee);

    res.status(201).json({
      message: 'Rating submitted successfully',
      rating: newRating
    });
  } catch (error) {
    console.error('Error creating rating:', error);
    res.status(500).json({ error: 'Failed to create rating' });
  }
};

// Get ratings for a user
exports.getUserRatings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const ratings = await Rating.find({ ratee: userId })
      .populate('rater', 'name email')
      .populate('item', 'name imageURL')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Rating.countDocuments({ ratee: userId });

    res.json({
      ratings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
};

// Get ratings given by a user
exports.getRatingsGiven = async (req, res) => {
  try {
    const userId = req.user._id;

    const ratings = await Rating.find({ rater: userId })
      .populate('ratee', 'name email')
      .populate('item', 'name imageURL')
      .sort({ createdAt: -1 });

    res.json({ ratings });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
};

// Check if user can rate another user for a specific item
exports.canRate = async (req, res) => {
  try {
    const { ratee, item } = req.query;
    const rater = req.user._id;

    if (rater.toString() === ratee) {
      return res.json({ canRate: false, reason: 'Cannot rate yourself' });
    }

    const existingRating = await Rating.findOne({
      rater,
      ratee,
      ...(item && { item })
    });

    if (existingRating) {
      return res.json({ canRate: false, reason: 'Already rated' });
    }

    res.json({ canRate: true });
  } catch (error) {
    console.error('Error checking rating eligibility:', error);
    res.status(500).json({ error: 'Failed to check rating eligibility' });
  }
};

// Helper function to update user's average rating
async function updateUserRating(userId) {
  try {
    const ratings = await Rating.find({ ratee: userId });
    
    if (ratings.length === 0) {
      await User.findByIdAndUpdate(userId, {
        averageRating: 0,
        ratingCount: 0
      });
      return;
    }

    const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / ratings.length;

    await User.findByIdAndUpdate(userId, {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      ratingCount: ratings.length
    });
  } catch (error) {
    console.error('Error updating user rating:', error);
  }
}

module.exports = exports;
