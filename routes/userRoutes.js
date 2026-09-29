import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { authenticateToken, JWT_SECRET } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/users/me
 * Fetch current user profile details
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    return res.status(200).json({
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        year: user.year,
        section: user.section,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Fetch profile error:', error);
    return res.status(500).json({ error: 'Internal server error while fetching user profile' });
  }
});

/**
 * PUT or POST /api/users/update
 * Update user profile details (Name and/or Password)
 * Ensures password updates use bcrypt and JWT is refreshed appropriately.
 */
const handleProfileUpdate = async (req, res) => {
  try {
    const { name, currentPassword, newPassword, confirmNewPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let isUpdated = false;

    // Handle Name update
    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return res.status(400).json({ error: 'Name cannot be empty' });
      }
      user.name = trimmedName;
      isUpdated = true;
    }

    // Handle Password update
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to set a new password' });
      }

      // Verify current password with bcrypt
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password does not match our records' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long' });
      }

      if (confirmNewPassword !== undefined && newPassword !== confirmNewPassword) {
        return res.status(400).json({ error: 'New password and confirmation do not match' });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      isUpdated = true;
    }

    if (!isUpdated) {
      return res.status(400).json({ error: 'No update data provided (provide name or newPassword)' });
    }

    // Save changes
    if (typeof user.save === 'function') {
      await user.save();
    } else {
      await User.findByIdAndUpdate(userId, {
        name: user.name,
        password: user.password
      });
    }

    // Issue refreshed JWT token with latest info
    const tokenPayload = {
      id: user._id || user.id,
      email: user.email,
      role: user.role,
      year: user.year,
      section: user.section
    };
    const refreshedToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    return res.status(200).json({
      message: 'Profile updated successfully',
      token: refreshedToken,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        year: user.year,
        section: user.section
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ error: 'Internal server error while updating profile' });
  }
};

router.put('/update', authenticateToken, handleProfileUpdate);
router.post('/update', authenticateToken, handleProfileUpdate);

export default router;
