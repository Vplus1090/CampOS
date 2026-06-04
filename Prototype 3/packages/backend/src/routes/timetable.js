import { Router } from 'express';
import TimetableClass from '../models/TimetableClass.js';
import TimetableMetadata from '../models/TimetableMetadata.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

/**
 * @route   GET /api/timetable/metadata
 * @desc    Get timetable filter metadata
 * @access  Public
 */
router.get('/metadata', async (req, res, next) => {
  try {
    const meta = await TimetableMetadata.findOne({});
    if (!meta) {
      return res.json({ semesters: {}, phases: {}, batches: {} });
    }
    res.json(meta);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/timetable/classes
 * @desc    Get all timetable classes structured as nested dictionary for frontend
 * @access  Public
 */
router.get('/classes', async (req, res, next) => {
  try {
    const classes = await TimetableClass.find({});
    
    // Structure dictionary exactly as frontend expects:
    // { [classKey]: { classes: { [day]: [classObj, ...] } } }
    const dbClasses = {};
    for (const c of classes) {
      if (!dbClasses[c.classKey]) {
        dbClasses[c.classKey] = { classes: {} };
      }
      if (!dbClasses[c.classKey].classes[c.day]) {
        dbClasses[c.classKey].classes[c.day] = [];
      }
      dbClasses[c.classKey].classes[c.day].push({
        _id: c._id,
        subject: c.subject,
        start: c.start,
        end: c.end,
        teacher: c.teacher,
        venue: c.venue,
        type: c.type,
        batches: c.batches,
      });
    }

    res.json(dbClasses);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/timetable/classes
 * @desc    Create a new timetable class session
 * @access  Authenticated (Requires admin or super_admin role)
 */
router.post('/classes', authenticate, requireRole('admin', 'super_admin'), async (req, res, next) => {
  try {
    const { classKey, day, subject, start, end, teacher, venue, type, batches } = req.body;

    if (!classKey || !day || !subject || !start || !end) {
      const error = new Error('classKey, day, subject, start, and end are required.');
      error.statusCode = 400;
      return next(error);
    }

    const newClass = await TimetableClass.create({
      classKey,
      day,
      subject,
      start,
      end,
      teacher: teacher || 'Faculty',
      venue: venue || 'N/A',
      type: type || 'L',
      batches: batches || [],
    });

    res.status(201).json(newClass);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   PUT /api/timetable/classes/:id
 * @desc    Update an existing timetable class session
 * @access  Authenticated (Requires admin or super_admin role)
 */
router.put('/classes/:id', authenticate, requireRole('admin', 'super_admin'), async (req, res, next) => {
  try {
    const { day, subject, start, end, teacher, venue, type, batches } = req.body;

    const targetClass = await TimetableClass.findById(req.params.id);
    if (!targetClass) {
      const error = new Error('Timetable class slot not found');
      error.statusCode = 404;
      return next(error);
    }

    if (day !== undefined) targetClass.day = day;
    if (subject !== undefined) targetClass.subject = subject;
    if (start !== undefined) targetClass.start = start;
    if (end !== undefined) targetClass.end = end;
    if (teacher !== undefined) targetClass.teacher = teacher;
    if (venue !== undefined) targetClass.venue = venue;
    if (type !== undefined) targetClass.type = type;
    if (batches !== undefined) targetClass.batches = batches;

    await targetClass.save();
    res.json(targetClass);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   DELETE /api/timetable/classes/:id
 * @desc    Delete/Remove a timetable class session
 * @access  Authenticated (Requires admin or super_admin role)
 */
router.delete('/classes/:id', authenticate, requireRole('admin', 'super_admin'), async (req, res, next) => {
  try {
    const targetClass = await TimetableClass.findByIdAndDelete(req.params.id);
    if (!targetClass) {
      const error = new Error('Timetable class slot not found');
      error.statusCode = 404;
      return next(error);
    }

    res.json({ message: 'Timetable class slot successfully deleted', id: req.params.id });
  } catch (err) {
    next(err);
  }
});

export default router;
