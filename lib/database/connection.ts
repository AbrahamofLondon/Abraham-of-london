// lib/database/connection.ts - UPDATED FOR WINDOWS
import mongoose from "mongoose";

// Windows-specific check
const isWindows = process.platform === "win32" || process.env.IS_WINDOWS === "true";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  if (isWindows) {
    console.warn("[Windows] MONGODB_URI not found, using local dev default");
    process.env.MONGODB_URI = "mongodb://localhost:27017/abraham-of-london-dev";
  } else {
    throw new Error("Please define the MONGODB_URI environment variable");
  }
}

// ✅ FIXED: Correct global typing (no 'Global' type)
declare global {
  // eslint-disable-next-line no-var
  var mongoose:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const globalWithMongo = globalThis as typeof globalThis & {
  mongoose?: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

let cached = globalWithMongo.mongoose;

if (!cached) {
  cached = globalWithMongo.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: isWindows ? 5 : 10,
      serverSelectionTimeoutMS: isWindows ? 60_000 : 5_000,
      socketTimeoutMS: 45_000,
      family: 4,
    };

    const uri = process.env.MONGODB_URI!;
    console.log(`[${isWindows ? "Windows" : "Non-Windows"}] Connecting to MongoDB...`);

    cached.promise = mongoose
      .connect(uri, opts)
      .then((m) => {
        console.log("✅ Connected to MongoDB");
        return m;
      })
      .catch((error) => {
        console.error("❌ MongoDB connection error:", error?.message || error);
        if (isWindows) {
          console.warn("[Windows] Consider MongoDB Atlas or Docker for dev stability.");
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

export function isWindowsEnvironment(): boolean {
  return isWindows;
}

export async function getDatabaseStatus(): Promise<{
  connected: boolean;
  environment: "development" | "production" | "test" | string;
  windows: boolean;
  memoryUsage?: {
    heapUsed: string;
    heapTotal: string;
    rss: string;
  };
}> {
  const status: {
    connected: boolean;
    environment: "development" | "production" | "test" | string;
    windows: boolean;
    memoryUsage?: {
      heapUsed: string;
      heapTotal: string;
      rss: string;
    };
  } = {
    connected: mongoose.connection.readyState === 1,
    environment: process.env.NODE_ENV || "development",
    windows: isWindows,
  };

  if (isWindows) {
    const mem = process.memoryUsage();
    status.memoryUsage = {
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024) + "MB",
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024) + "MB",
      rss: Math.round(mem.rss / 1024 / 1024) + "MB",
    };
  }

  return status;
}