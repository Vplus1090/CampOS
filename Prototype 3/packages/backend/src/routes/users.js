import { Router } from 'express';
import User from '../models/User.js';
import { authenticate, requireRole, requirePermission } from '../middleware/auth.js';

const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireRole('super_admin'));

// ─── GET /api/users — List all users (paginated, filterable) ────────────────────

router.get('/', requirePermission('manage:users'), async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      search,
      suspended,
    } = req.query;

    const filter = {};

    if (role && ['student', 'educator', 'admin', 'canteen_admin', 'super_admin'].includes(role)) {
      filter.role = role;
    }

    if (suspended === 'true') filter.isSuspended = true;
    if (suspended === 'false') filter.isSuspended = false;

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const limitNum = parseInt(limit, 10);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -refreshTokens')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page, 10),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/users/:id — Get single user ───────────────────────────────────────

router.get('/:id', requirePermission('manage:users'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password -refreshTokens');

    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      return next(error);
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/users — Create new user ──────────────────────────────────────────

router.post('/', requirePermission('manage:users'), async (req, res, next) => {
  try {
    const {
      email,
      password,
      role,
      firstName,
      lastName,
      phone,
      studentProfile,
      educatorProfile,
    } = req.body;

    // Validate required fields
    if (!email || !password || !role || !firstName || !lastName) {
      const error = new Error('email, password, role, firstName, and lastName are required.');
      error.statusCode = 400;
      return next(error);
    }

    if (!['student', 'educator', 'admin', 'canteen_admin', 'super_admin'].includes(role)) {
      const error = new Error('Role must be one of: student, educator, admin, canteen_admin, super_admin.');
      error.statusCode = 400;
      return next(error);
    }

    // Check if email already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      const error = new Error('A user with this email already exists.');
      error.statusCode = 409;
      return next(error);
    }

    // Build user data
    const userData = {
      email,
      password,
      role,
      firstName,
      lastName,
      phone,
      mustChangePassword: true,
    };

    // Attach role-specific profile
    if (role === 'student' && studentProfile) {
      userData.studentProfile = studentProfile;
    }
    if (role === 'educator' && educatorProfile) {
      userData.educatorProfile = educatorProfile;
    }

    const user = await User.create(userData);

    res.status(201).json({
      success: true,
      message: `${role} account created successfully. User must change password on first login.`,
      data: user.toSafeObject(),
    });
  } catch (err) {
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
      err.statusCode = 400;
    }
    next(err);
  }
});

// ─── PATCH /api/users/:id — Update user profile ────────────────────────────────

router.patch('/:id', requirePermission('manage:users'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      return next(error);
    }

    // Fields that can be updated
    const allowedFields = [
      'firstName', 'lastName', 'phone', 'avatar',
      'isEmailVerified', 'studentProfile', 'educatorProfile',
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    }

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully.',
      data: user.toSafeObject(),
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      err.statusCode = 400;
    }
    next(err);
  }
});

// ─── PATCH /api/users/:id/role — Change user role ───────────────────────────────

router.patch('/:id/role', requirePermission('assign:roles'), async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!role || !['student', 'educator', 'admin', 'canteen_admin', 'super_admin'].includes(role)) {
      const error = new Error('Role must be one of: student, educator, admin, canteen_admin, super_admin.');
      error.statusCode = 400;
      return next(error);
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      return next(error);
    }

    // Prevent admin from changing their own role
    if (user._id.toString() === req.user._id.toString()) {
      const error = new Error('You cannot change your own role.');
      error.statusCode = 400;
      return next(error);
    }

    const oldRole = user.role;
    user.role = role;

    // Clear profile data that doesn't match the new role
    if (role !== 'student') user.studentProfile = undefined;
    if (role !== 'educator') user.educatorProfile = undefined;

    await user.save();

    res.json({
      success: true,
      message: `User role changed from ${oldRole} to ${role}.`,
      data: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/users/:id/suspend — Toggle suspension ──────────────────────────

router.patch('/:id/suspend', requirePermission('suspend:users'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      return next(error);
    }

    // Prevent admin from suspending themselves
    if (user._id.toString() === req.user._id.toString()) {
      const error = new Error('You cannot suspend your own account.');
      error.statusCode = 400;
      return next(error);
    }

    // Toggle suspension
    user.isSuspended = !user.isSuspended;

    // If suspending, invalidate all refresh tokens
    if (user.isSuspended) {
      user.invalidateAllTokens();
    }

    await user.save();

    res.json({
      success: true,
      message: user.isSuspended
        ? 'User account suspended. All active sessions invalidated.'
        : 'User account reactivated.',
      data: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/users/:id — Permanently delete user ────────────────────────────

router.delete('/:id', requirePermission('delete:users'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      return next(error);
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      const error = new Error('You cannot delete your own account.');
      error.statusCode = 400;
      return next(error);
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: `User ${user.email} permanently deleted.`,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
