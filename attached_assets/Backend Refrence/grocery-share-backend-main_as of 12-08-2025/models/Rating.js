const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  rater: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Rater is required']
  },
  ratee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Ratee is required']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  review: {
    type: String,
    trim: true,
    maxlength: [500, 'Review cannot exceed 500 characters']
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  },
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation'
  }
}, {
  timestamps: true
});

// Prevent users from rating themselves
ratingSchema.pre('save', function(next) {
  if (this.rater.equals(this.ratee)) {
    next(new Error('Users cannot rate themselves'));
  } else {
    next();
  }
});

// Create compound index to prevent duplicate ratings for same transaction
ratingSchema.index({ rater: 1, ratee: 1, item: 1 }, { unique: true, sparse: true });
ratingSchema.index({ ratee: 1, createdAt: -1 });
ratingSchema.index({ rater: 1, createdAt: -1 });

module.exports = mongoose.model('Rating', ratingSchema);
