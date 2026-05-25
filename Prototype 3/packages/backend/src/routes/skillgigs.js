import { Router } from 'express';
import SkillGig from '../models/SkillGig.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

/**
 * @route   GET /api/skillgigs
 * @desc    Fetch all skill swap gigs with optional keyword filtering
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const { search } = req.query;
    const filter = {};

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { SkillOffered: searchRegex },
        { SkillWanted: searchRegex },
        { StudentName: searchRegex },
      ];
    }

    const gigs = await SkillGig.find(filter).sort({ createdAt: -1 });
    res.json(gigs);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/skillgigs
 * @desc    Create a new student peer-to-peer skill gig swap
 * @access  Public
 */
router.post('/', async (req, res, next) => {
  try {
    const { StudentName, SkillOffered, SkillWanted, Status, ContactInfo } = req.body;

    const newGig = await SkillGig.create({
      StudentName,
      SkillOffered,
      SkillWanted,
      Status: Status || 'Active',
      ContactInfo,
      IsReported: false,
    });

    res.status(201).json(newGig);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   PATCH /api/skillgigs/:id/report
 * @desc    Report a skill swap gig as inappropriate
 * @access  Authenticated (Any student or user can report)
 */
router.patch('/:id/report', authenticate, async (req, res, next) => {
  try {
    const { ReportReason } = req.body;
    
    const gig = await SkillGig.findById(req.params.id);
    if (!gig) {
      const error = new Error('Skill swap entry not found');
      error.statusCode = 404;
      return next(error);
    }

    gig.IsReported = true;
    if (ReportReason) {
      gig.ReportReason = ReportReason;
    }

    await gig.save();
    res.json({ message: 'Listing reported successfully to system administrators', gig });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   PATCH /api/skillgigs/:id/status
 * @desc    Update the status of a skill swap listing (e.g. to Completed or Closed)
 * @access  Authenticated
 */
router.patch('/:id/status', authenticate, async (req, res, next) => {
  try {
    const { Status } = req.body;
    if (!Status || !['Active', 'Completed', 'Closed'].includes(Status)) {
      const error = new Error('Invalid status provided');
      error.statusCode = 400;
      return next(error);
    }

    const gig = await SkillGig.findById(req.params.id);
    if (!gig) {
      const error = new Error('Skill swap entry not found');
      error.statusCode = 404;
      return next(error);
    }

    gig.Status = Status;
    await gig.save();

    res.json({ message: `Listing status successfully updated to ${Status}`, gig });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   DELETE /api/skillgigs/:id
 * @desc    Delete/Remove a skill swap gig by ID
 * @access  Authenticated
 */
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const gig = await SkillGig.findByIdAndDelete(req.params.id);

    if (!gig) {
      const error = new Error('Skill swap entry not found');
      error.statusCode = 404;
      return next(error);
    }

    res.json({ message: 'Skill swap entry successfully removed', id: req.params.id });
  } catch (err) {
    next(err);
  }
});

export default router;
