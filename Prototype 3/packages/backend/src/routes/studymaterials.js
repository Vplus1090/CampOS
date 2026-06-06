import { Router } from 'express';
import StudyMaterial from '../models/StudyMaterial.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

/**
 * @route   GET /api/studymaterials
 * @desc    Get all study materials
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const materials = await StudyMaterial.find({}).sort({ createdAt: -1 });
    res.json(materials);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/studymaterials
 * @desc    Create a new study material
 * @access  Authenticated (Requires super_admin role)
 */
router.post('/', authenticate, requireRole('super_admin'), async (req, res, next) => {
  try {
    const { name, driveLink, branch, semester, type, code, size, subject } = req.body;

    if (!name || !driveLink || !branch || !semester) {
      const error = new Error('name, driveLink, branch, and semester are required.');
      error.statusCode = 400;
      return next(error);
    }

    const material = await StudyMaterial.create({
      name,
      driveLink,
      branch,
      semester,
      type: type || 'Notes',
      subject: subject || 'General',
      code: code || 'GEN-101',
      size: size || '1.2 MB',
    });

    res.status(201).json(material);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   PUT /api/studymaterials/:id
 * @desc    Update an existing study material
 * @access  Authenticated (Requires super_admin role)
 */
router.put('/:id', authenticate, requireRole('super_admin'), async (req, res, next) => {
  try {
    const { name, driveLink, branch, semester, type, code, size, subject } = req.body;

    const material = await StudyMaterial.findById(req.params.id);
    if (!material) {
      const error = new Error('Study material not found');
      error.statusCode = 404;
      return next(error);
    }

    if (name !== undefined) material.name = name;
    if (driveLink !== undefined) material.driveLink = driveLink;
    if (branch !== undefined) material.branch = branch;
    if (semester !== undefined) material.semester = semester;
    if (type !== undefined) material.type = type;
    if (subject !== undefined) material.subject = subject;
    if (code !== undefined) material.code = code;
    if (size !== undefined) material.size = size;

    await material.save();
    res.json(material);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   DELETE /api/studymaterials/:id
 * @desc    Delete a study material
 * @access  Authenticated (Requires super_admin role)
 */
router.delete('/:id', authenticate, requireRole('super_admin'), async (req, res, next) => {
  try {
    const material = await StudyMaterial.findByIdAndDelete(req.params.id);
    if (!material) {
      const error = new Error('Study material not found');
      error.statusCode = 404;
      return next(error);
    }

    res.json({ message: 'Study material successfully deleted', id: req.params.id });
  } catch (err) {
    next(err);
  }
});

export default router;
