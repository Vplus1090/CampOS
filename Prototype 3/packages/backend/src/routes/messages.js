import { Router } from 'express';
import Message from '../models/Message.js';

const router = Router();

/**
 * @route   GET /api/messages
 * @desc    Fetch message conversation history between two users (e.g. userA=Kunal&userB=Sanya)
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const { userA, userB } = req.query;

    if (!userA || !userB) {
      const error = new Error('Both userA and userB names are required in queries');
      error.statusCode = 400;
      return next(error);
    }

    // Query messages sent A -> B OR B -> A
    const messages = await Message.find({
      $or: [
        { SenderName: userA, ReceiverName: userB },
        { SenderName: userB, ReceiverName: userA },
      ],
    }).sort({ Timestamp: 1 }); // Sort chronologically

    res.json(messages);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/messages
 * @desc    Send a new chat message to a peer
 * @access  Public
 */
router.post('/', async (req, res, next) => {
  try {
    const { SenderName, ReceiverName, Content } = req.body;

    if (!SenderName || !ReceiverName || !Content) {
      const error = new Error('SenderName, ReceiverName, and Content are required');
      error.statusCode = 400;
      return next(error);
    }

    const newMessage = await Message.create({
      SenderName,
      ReceiverName,
      Content,
      Timestamp: new Date(),
    });

    res.status(201).json(newMessage);
  } catch (err) {
    next(err);
  }
});

export default router;
