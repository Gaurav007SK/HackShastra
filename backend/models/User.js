const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['farmer', 'vet', 'admin'],
    required: true,
    default: 'farmer'
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'hi', 'bn', 'te', 'mr', 'gu', 'kn', 'ml', 'ta', 'pa', 'or', 'as', 'ne', 'ur', 'sd', 'ks']
  },
  // Farmer-specific fields
  farmerProfile: {
    farmName: String,
    farmLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0]
      }
    },
    livestockTypes: [String],
    herdSize: Number,
    address: String
  },
  // Vet-specific fields
  vetProfile: {
    qualification: String,
    registrationNumber: String,
    clinicAddress: String,
    verified: {
      type: Boolean,
      default: false
    },
    availableSlots: [String]
  },
  // Refresh token for JWT
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: '7d' // Auto-delete after 7 days
    }
  }]
}, {
  timestamps: true
});

// Index for geospatial queries
userSchema.index({ 'farmerProfile.farmLocation': '2dsphere' });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  
  try {
    const saltRounds = 12;
    this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Add refresh token
userSchema.methods.addRefreshToken = function(token) {
  this.refreshTokens.push({ token });
  return this.save();
};

// Remove refresh token
userSchema.methods.removeRefreshToken = function(token) {
  this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token);
  return this.save();
};

// Remove all refresh tokens
userSchema.methods.removeAllRefreshTokens = function() {
  this.refreshTokens = [];
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
