import { Router } from 'express';
import healthRouter from './health.js';
import authRouter from './auth.js';
import usersRouter from './users.js';
import noticesRouter from './notices.js';
import skillgigsRouter from './skillgigs.js';
import canteenRouter from './canteen.js';
import messagesRouter from './messages.js';
import messRouter from './mess.js';
import webportalRouter from './webportal.js';
import calendarRouter from './calendar.js';
import timetableRouter from './timetable.js';
import studymaterialsRouter from './studymaterials.js';

const router = Router();

// Mount route modules
router.use(healthRouter);
router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/notices', noticesRouter);
router.use('/skillgigs', skillgigsRouter);
router.use('/canteen', canteenRouter);
router.use('/messages', messagesRouter);
router.use('/mess', messRouter);
router.use('/webportal', webportalRouter);
router.use('/calendar', calendarRouter);
router.use('/timetable', timetableRouter);
router.use('/studymaterials', studymaterialsRouter);

export default router;
