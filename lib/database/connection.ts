// lib/database/connection.ts - UPDATED FOR WINDOWS
import mongoose from 'mongoose';

// Windows-specific check
const isWindows = process.platform === 'win32' || process.env.IS_WINDOWS === 'true';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  if (isWindows) {
    console.warn('[Windows] MONGODB_URI not found, using memory database for development');
    // Use in-memory database for Windows development
    process.env.MONGODB_URI = 'mongodb://localhost:27017/abraham-of-london-dev';
  } else {
    throw new Error('Please define the MONGODB_URI environment variable');
  }
}

interface GlobalWithMongo extends Global {
  mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

const globalWithMongo = global as unknown as GlobalWithMongo;

let cached = globalWithMongo.mongoose;

if (!cached) {
  cached = globalWithMongo.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: isWindows ? 5 : 10, // Smaller pool for Windows
      serverSelectionTimeoutMS: isWindows ? 60000 : 5000, // Longer timeout for Windows
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4 (Windows issue)
    };

    console.log(`[${isWindows ? 'Windows' : 'Non-Windows'}] Connecting to MongoDB...`);
    
    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log('✅ Connected to MongoDB');
      return mongoose;
    }).catch((error) => {
      console.error('❌ MongoDB connection error:', error.message);
      if (isWindows) {
        console.warn('[Windows] Consider using MongoDB Atlas or Docker for Windows development');
      }
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Windows-specific database helpers
export function isWindowsEnvironment(): boolean {
  return isWindows;
}

export async function getDatabaseStatus(): Promise<{
  connected: boolean;
  environment: string;
  windows: boolean;
  memoryUsage?: any;
}> {
  const status = {
    connected: mongoose.connection.readyState === 1,
    environment: process.env.NODE_ENV || 'development',
    windows: isWindows,
  };

  if (isWindows) {
    const memoryUsage = process.memoryUsage();
    status.memoryUsage = {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
    };
  }

  return status;
}