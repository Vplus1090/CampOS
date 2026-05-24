import { Router } from 'express';
import MessToken from '../models/MessToken.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * @route   POST /api/mess/buy-guest-token
 * @desc    Buy a guest meal pass (₹60) expiring in 90 minutes
 * @access  Authenticated (Student/Admin/Educator)
 */
router.post('/buy-guest-token', authenticate, async (req, res, next) => {
  try {
    const studentName = req.user ? `${req.user.firstName} ${req.user.lastName}` : 'Guest Student';
    
    const now = new Date();
    // Expiry set to exactly 90 minutes from now
    const expiry = new Date(now.getTime() + 90 * 60 * 1000);

    const token = await MessToken.create({
      StudentName: studentName,
      PassType: 'Guest',
      IssuedAt: now,
      ExpiryTime: expiry,
    });

    res.status(201).json({
      success: true,
      message: 'Guest meal pass purchased successfully',
      token,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
