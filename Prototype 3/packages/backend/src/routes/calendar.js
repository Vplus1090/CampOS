import { Router } from 'express';
import CalendarEvent from '../models/CalendarEvent.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

/**
 * @route   GET /api/calendar
 * @desc    Get all calendar events
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    // Return all events sorted by date or creation
    const events = await CalendarEvent.find({}).sort({ createdAt: 1 });
    res.json(events);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/calendar
 * @desc    Create a new calendar event
 * @access  Authenticated (Requires admin or super_admin role)
 */
router.post('/', authenticate, requireRole('admin', 'super_admin'), async (req, res, next) => {
  try {
    const { date, category, tags, desc, theme } = req.body;

    if (!date || !category || !desc) {
      const error = new Error('date, category, and desc are required.');
      error.statusCode = 400;
      return next(error);
    }

    const event = await CalendarEvent.create({
      date,
      category,
      tags: tags || [],
      desc,
      theme: theme || 'teal',
    });

    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   PUT /api/calendar/:id
 * @desc    Update an existing calendar event
 * @access  Authenticated (Requires admin or super_admin role)
 */
router.put('/:id', authenticate, requireRole('admin', 'super_admin'), async (req, res, next) => {
  try {
    const { date, category, tags, desc, theme } = req.body;

    const event = await CalendarEvent.findById(req.params.id);
    if (!event) {
      const error = new Error('Calendar event not found');
      error.statusCode = 404;
      return next(error);
    }

    if (date !== undefined) event.date = date;
    if (category !== undefined) event.category = category;
    if (tags !== undefined) event.tags = tags;
    if (desc !== undefined) event.desc = desc;
    if (theme !== undefined) event.theme = theme;

    await event.save();
    res.json(event);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   DELETE /api/calendar/:id
 * @desc    Delete a calendar event
 * @access  Authenticated (Requires admin or super_admin role)
 */
router.delete('/:id', authenticate, requireRole('admin', 'super_admin'), async (req, res, next) => {
  try {
    const event = await CalendarEvent.findByIdAndDelete(req.params.id);
    if (!event) {
      const error = new Error('Calendar event not found');
      error.statusCode = 404;
      return next(error);
    }

    res.json({ message: 'Calendar event successfully deleted', id: req.params.id });
  } catch (err) {
    next(err);
  }
});

export default router;
