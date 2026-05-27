/**
 * Express app configured for Vercel Serverless Functions.
 *
 * Key differences from the standalone server (packages/backend/src/index.js):
 * 1. Does NOT call app.listen() — Vercel manages the HTTP layer.
 * 2. Caches the MongoDB connection across warm invocations.
 * 3. Runs seeds once per cold start (idempotent, so safe if multiple
 *    instances cold-start simultaneously).
 * 4. Reads env vars from process.env directly (Vercel injects them).
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

// ─── Re-use backend source directly via relative imports ────────────────────
import env from '../packages/backend/src/config/env.js';
import connectDB from '../packages/backend/src/config/db.js';
import seedAdmin from '../packages/backend/src/config/seed.js';
import seedSkillGigs from '../packages/backend/src/config/seedSkillGigs.js';
import seedCanteen from '../packages/backend/src/config/seedCanteen.js';
import routes from '../packages/backend/src/routes/index.js';
import notFound from '../packages/backend/src/middleware/notFound.js';
import errorHandler from '../packages/backend/src/middleware/errorHandler.js';
import { isWebportalProxyRequest } from '../packages/backend/src/utils/webportalRequest.js';

// ─── App ────────────────────────────────────────────────────────────────────────

const app = express();

// ─── Security & Parsing ─────────────────────────────────────────────────────────

app.use(helmet());

const allowedOrigins = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : [];

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use((req, res, next) => {
  if (isWebportalProxyRequest(req)) {
    return next();
  }
  express.json({ limit: '10mb' })(req, res, next);
});

app.use((req, res, next) => {
  if (isWebportalProxyRequest(req)) {
    return next();
  }
  express.urlencoded({ extended: true })(req, res, next);
});

app.use(cookieParser());

// ─── Logging (minimal for serverless) ───────────────────────────────────────────

app.use(morgan('combined'));

// ─── DB connection + seeding middleware ──────────────────────────────────────────
// Runs once per cold start, then cached via mongoose's internal state.

let isSeeded = false;

app.use(async (_req, _res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    if (!isSeeded) {
      await seedAdmin();
      await seedSkillGigs();
      await seedCanteen();
      isSeeded = true;
    }

    next();
  } catch (err) {
    next(err);
  }
});

// ─── Routes ─────────────────────────────────────────────────────────────────────
// Mount twice: local/Render use /api/* ; Vercel strips the /api prefix before Express.
app.use('/api', routes);
app.use(routes);

// ─── Error Handling ─────────────────────────────────────────────────────────────

app.use(notFound);
app.use(errorHandler);

export default app;
