// CampOS entry point (reload trigger)
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import env from './config/env.js';
import connectDB from './config/db.js';
import { disconnectDB } from './config/db.js';
import seedAdmin from './config/seed.js';
import seedSkillGigs from './config/seedSkillGigs.js';
import seedCanteen from './config/seedCanteen.js';
import routes from './routes/index.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';
import { isWebportalProxyRequest } from './utils/webportalRequest.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── App Initialization ────────────────────────────────────────────────────────

const app = express();

// ─── Security & Parsing Middleware ──────────────────────────────────────────────

// Disable CSP so that Google Fonts and dynamic CSS styles load perfectly
app.use(helmet({ contentSecurityPolicy: false }));

const allowedOrigins = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173'];

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin, matched configured origins, or any localhost origin
      if (
        !origin || 
        allowedOrigins.includes(origin) || 
        /^https?:\/\/localhost(:\d+)?$/.test(origin) || 
        /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)
      ) {
        return cb(null, true);
      }
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

// ─── Logging ────────────────────────────────────────────────────────────────────

if (env.isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.post('/api/client-error', express.json(), (req, res) => {
  console.error('\n🚨 [CLIENT RUNTIME ERROR] 🚨');
  console.error('Message:', req.body.message);
  console.error('At:', `${req.body.filename}:${req.body.lineno}:${req.body.colno}`);
  console.error('Stack:', req.body.stack);
  console.error('---------------------------\n');
  res.sendStatus(204);
});

// ─── Routes ─────────────────────────────────────────────────────────────────────

app.use('/api', routes);

// ─── Production Static Assets ───────────────────────────────────────────────────

if (env.isProd) {
  const distPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(distPath));

  // Wildcard fallback for React SPA routing
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

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
