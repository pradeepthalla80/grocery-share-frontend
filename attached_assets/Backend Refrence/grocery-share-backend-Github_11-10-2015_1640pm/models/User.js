const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId;
    },
    minlength: [8, 'Password must be at least 8 characters'],
    validate: {
      validator: function(v) {
        // Skip validation for Google OAuth users (no password)
        if (!v && this.googleId) return true;
        
        // Password must contain:
        // - At least one uppercase letter
        // - At least one lowercase letter
        // - At least one number
        // - At least one special character
        // - Minimum 8 characters total
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-{}[\]:;"'<>,.?/\\|`~])[A-Za-z\d@$!%*?&#^()_+=\-{}[\]:;"'<>,.?/\\|`~]{8,}$/.test(v);
      },
      message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'super_admin'],
    default: 'user'
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  acceptedTerms: {
    type: Boolean,
    default: false
  },
  termsAcceptedAt: {
    type: Date
  },
  
  // ========== ADDED FOR STORE MODE - START ==========
  isStoreOwner: {
    type: Boolean,
    default: false
  },
  storeMode: {
    type: Boolean,
    default: false
  },
  storeName: {
    type: String,
    default: null,
    trim: true
  },
  storeAgreementAccepted: {
    type: Boolean,
    default: false
  },
  storeActivatedAt: {
    type: Date,
    default: null
  },
  // ========== ADDED FOR STORE MODE - END ==========
  
  notificationSettings: {
    inApp: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    radius: {
      type: Number,
      default: 5,
      min: 1,
      max: 50
    },
    categories: {
      type: [String],
      default: []
    },
    tags: {
      type: [String],
      default: []
    }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: null
    }
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingCount: {
    type: Number,
    default: 0,
    min: 0
  },
  badges: [{
    badge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Badge'
    },
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  stats: {
    itemsShared: {
      type: Number,
      default: 0
    },
    itemsReceived: {
      type: Number,
      default: 0
    },
    conversationsStarted: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
