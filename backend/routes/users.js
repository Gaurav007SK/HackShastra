const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { verifyToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Get current user profile
router.get('/me', verifyToken, (req, res) => {
  const userResponse = {
    id: req.user._id,
    email: req.user.email,
    fullName: req.user.fullName,
    role: req.user.role,
    phone: req.user.phone,
    language: req.user.language,
    farmerProfile: req.user.farmerProfile,
    vetProfile: req.user.vetProfile,
    createdAt: req.user.createdAt,
    updatedAt: req.user.updatedAt
  };

  res.json({
    user: userResponse
  });
});

// Update current user profile
router.put('/me', verifyToken, [
  body('fullName').optional().trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('language').optional().isIn(['en', 'hi', 'bn', 'te', 'mr', 'gu', 'kn', 'ml', 'ta', 'pa', 'or', 'as', 'ne', 'ur', 'sd', 'ks']),
  body('farmerProfile.farmName').optional().trim(),
  body('farmerProfile.livestockTypes').optional().isArray(),
  body('farmerProfile.herdSize').optional().isInt({ min: 0 }),
  body('farmerProfile.address').optional().trim(),
  body('farmerProfile.farmLocation.coordinates').optional().isArray({ min: 2, max: 2 }),
  body('vetProfile.qualification').optional().trim(),
  body('vetProfile.registrationNumber').optional().trim(),
  body('vetProfile.clinicAddress').optional().trim()
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const updateData = {};
    const { fullName, phone, language, farmerProfile, vetProfile } = req.body;

    // Update basic fields
    if (fullName) updateData.fullName = fullName;
    if (phone) updateData.phone = phone;
    if (language) updateData.language = language;

    // Update role-specific profiles
    if (req.user.role === 'farmer' && farmerProfile) {
      updateData.farmerProfile = {
        ...req.user.farmerProfile,
        ...farmerProfile
      };
    }

    if (req.user.role === 'vet' && vetProfile) {
      updateData.vetProfile = {
        ...req.user.vetProfile,
        ...vetProfile
      };
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    // Return updated user data
    const userResponse = {
      id: updatedUser._id,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      role: updatedUser.role,
      phone: updatedUser.phone,
      language: updatedUser.language,
      farmerProfile: updatedUser.farmerProfile,
      vetProfile: updatedUser.vetProfile,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };

    res.json({
      message: 'Profile updated successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      error: 'Profile update failed' 
    });
  }
});

// Get user by ID (admin only)
router.get('/:id', verifyToken, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash -refreshTokens');
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    const userResponse = {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      phone: user.phone,
      language: user.language,
      farmerProfile: user.farmerProfile,
      vetProfile: user.vetProfile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({
      user: userResponse
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      error: 'Failed to get user' 
    });
  }
});

// Get all users (admin only)
router.get('/', verifyToken, authorize('admin'), async (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (role) query.role = role;

    const users = await User.find(query)
      .select('-passwordHash -refreshTokens')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    const userResponses = users.map(user => ({
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      phone: user.phone,
      language: user.language,
      farmerProfile: user.farmerProfile,
      vetProfile: user.vetProfile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    res.json({
      users: userResponses,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      error: 'Failed to get users' 
    });
  }
});

module.exports = router;
