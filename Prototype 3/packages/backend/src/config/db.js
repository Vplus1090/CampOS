import mongoose from 'mongoose';
import env from './env.js';

/**
 * Connect to MongoDB with Mongoose.
 * Includes retry logic and graceful shutdown handling.
 */
const connectDB = async () => {
  const MAX_RETRIES = 5;
  const RETRY_DELAY_MS = 3000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const conn = await mongoose.connect(env.MONGODB_URI, {
        // Mongoose 8 defaults are already optimal, but explicit for clarity
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      console.log(`✅ MongoDB connected: ${conn.connection.host}`);
      break;
    } catch (err) {
      console.error(
        `⚠️  MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`
      );

      if (attempt === MAX_RETRIES) {
        console.error('❌ Could not connect to MongoDB after maximum retries. Exiting.');
        process.exit(1);
      }

      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  // Connection event listeners
  mongoose.connection.on('error', (err) => {
    console.error(`❌ MongoDB connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected');
  });
};

/**
 * Gracefully close the database connection.
 */
export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed gracefully');
  } catch (err) {
    console.error(`❌ Error closing MongoDB connection: ${err.message}`);
  }
};

export default connectDB;
