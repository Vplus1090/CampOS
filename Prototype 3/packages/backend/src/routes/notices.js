import { Router } from 'express';
import Notice from '../models/Notice.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();

/**
 * @route   GET /api/notices
 * @desc    Fetch all notices sorted by Date (newest first)
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const { priority } = req.query;
    const filter = {};

    if (priority) {
      filter.PriorityLevel = priority;
    }

    const notices = await Notice.find(filter).sort({ Date: -1 });
    res.json(notices);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/notices
 * @desc    Create a new campus-wide notice
 * @access  Authenticated (Requires manage:content permission)
 */
router.post('/', authenticate, requirePermission('manage:content'), async (req, res, next) => {
  try {
    const { Title, Content, PriorityLevel, PostedBy } = req.body;

    // Build notice fields
    const noticeData = {
      Title,
      Content,
      PriorityLevel: PriorityLevel || 'Medium',
      PostedBy: PostedBy || 'Campus Administrator',
      Date: new Date(),
    };

    // If request has cookie authentication, try to override PostedBy with user's name
    // This is optional to allow easy guest postings during testing/demo
    if (req.cookies?.accessToken) {
      try {
        // Authenticate manually to not fail the request if token is invalid
        const decoded = verifyAccessToken(req.cookies.accessToken);
        const user = await User.findById(decoded.id);
        if (user) {
          noticeData.PostedBy = user.fullName;
        }
      } catch (e) {
        // Ignore token decode error and fall back to postedBy or guest
      }
    }

    const newNotice = await Notice.create(noticeData);
    res.status(201).json(newNotice);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   DELETE /api/notices/:id
 * @desc    Delete a notice by ID
 * @access  Authenticated (Requires manage:content permission)
 */
router.delete('/:id', authenticate, requirePermission('manage:content'), async (req, res, next) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);

    if (!notice) {
      const error = new Error('Notice not found');
      error.statusCode = 404;
      return next(error);
    }

    res.json({ message: 'Notice successfully removed', id: req.params.id });
  } catch (err) {
    next(err);
  }
});

export default router;
