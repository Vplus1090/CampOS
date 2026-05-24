import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import env from './config/env.js';
import connectDB from './config/db.js';
import { disconnectDB } from './config/db.js';
import seedAdmin from './config/seed.js';
import seedSkillGigs from './config/seedSkillGigs.js';
import seedCanteen from './config/seedCanteen.js';
import routes from './routes/index.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

// ─── App Initialization ────────────────────────────────────────────────────────

const app = express();

// ─── Security & Parsing Middleware ──────────────────────────────────────────────

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Logging ────────────────────────────────────────────────────────────────────

if (env.isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ─── Routes ─────────────────────────────────────────────────────────────────────

app.use('/api', routes);

// ─── Error Handling ─────────────────────────────────────────────────────────────

app.use(notFound);
app.use(errorHandler);

// ─── Server Startup ─────────────────────────────────────────────────────────────

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Seed default admin account (if no admin exists)
  await seedAdmin();

  // Seed default SkillGigs and mock Notices
  await seedSkillGigs();

  // Seed default Canteen Menu Items
  await seedCanteen();

  const server = app.listen(env.PORT, () => {
    console.log(
      `\n🏕️  CampOS Backend running in ${env.NODE_ENV} mode on port ${env.PORT}\n` +
      `   Health: http://localhost:${env.PORT}/api/health\n`
    );
  });

  // ─── Graceful Shutdown ──────────────────────────────────────────────────────

  const shutdown = async (signal) => {
    console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);

    server.close(async () => {
      await disconnectDB();
      console.log('👋 Server closed. Goodbye!');
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      console.error('⚠️  Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle unhandled rejections
  process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
    shutdown('UNHANDLED_REJECTION');
  });
};

startServer();
