// lib/database/connection.ts - UPDATED FOR WINDOWS (PRODUCTION SAFE)
import mongoose from "mongoose";

// Windows-specific check
const isWindows = process.platform === "win32" || process.env.IS_WINDOWS === "true";
const isDevelopment = process.env.NODE_ENV === "development";

const MONGODB_URI = process.env.MONGODB_URI;

// 🛡️ SAFE: Only use fallback in development, never in production
if (!MONGODB_URI) {
  if (isDevelopment && isWindows) {
    console.warn(
      "\x1b[33m⚠️ [DEV WARNING] MONGODB_URI not found, using local dev default\x1b[0m\n" +
      "\x1b[33m   This fallback will NOT work in production. Set MONGODB_URI in your environment.\x1b[0m"
    );
    process.env.MONGODB_URI = "mongodb://localhost:27017/abraham-of-london-dev";
  } else {
    throw new Error(
      "❌ MONGODB_URI environment variable is not defined.\n" +
      "   In production: Set this in your hosting platform (Netlify/Vercel)\n" +
      "   In development: Create a .env.local file with MONGODB_URI=your_connection_string"
    );
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
    
    // Log connection attempt (safe for production)
    console.log(`[${isWindows ? "Windows" : "Non-Windows"}] Connecting to MongoDB...`);
    if (isDevelopment) {
      console.log(`📍 URI: ${uri.replace(/:[^:]*@/, ':***@')}`); // Mask password
    }

    cached.promise = mongoose
      .connect(uri, opts)
      .then((m) => {
        console.log("✅ Connected to MongoDB");
        return m;
      })
      .catch((error) => {
        console.error("❌ MongoDB connection error:", error?.message || error);
        if (isDevelopment && isWindows) {
          console.warn(
            "\x1b[33m💡 Windows Dev Tip: Make sure MongoDB is running locally:\x1b[0m\n" +
            "   • 'mongod' in terminal, or\n" +
            "   • Use MongoDB Atlas (free tier) for easier setup\n" +
            "   • Set MONGODB_URI in .env.local"
          );
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

export function isDevelopmentEnvironment(): boolean {
  return isDevelopment;
}

export async function getDatabaseStatus(): Promise<{
  connected: boolean;
  environment: "development" | "production" | "test" | string;
  windows: boolean;
  usingFallback: boolean;
  memoryUsage?: {
    heapUsed: string;
    heapTotal: string;
    rss: string;
  };
}> {
  const usingFallback = !MONGODB_URI && isDevelopment && isWindows;
  
  const status: {
    connected: boolean;
    environment: "development" | "production" | "test" | string;
    windows: boolean;
    usingFallback: boolean;
    memoryUsage?: {
      heapUsed: string;
      heapTotal: string;
      rss: string;
    };
  } = {
    connected: mongoose.connection.readyState === 1,
    environment: process.env.NODE_ENV || "development",
    windows: isWindows,
    usingFallback,
  };

  if (usingFallback) {
    console.warn(
      "\x1b[33m⚠️ WARNING: Using MongoDB localhost fallback\x1b[0m\n" +
      "\x1b[33m   This will NOT work in production. Set MONGODB_URI in your environment.\x1b[0m"
    );
  }

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

// Optional: Force check environment variables in production
if (process.env.NODE_ENV === "production" && !process.env.MONGODB_URI) {
  console.error(
    "\x1b[31m❌ FATAL: MONGODB_URI is not set in production environment!\x1b[0m\n" +
    "\x1b[31m   Set this in your hosting platform (Netlify/Vercel) immediately.\x1b[0m"
  );
  // Don't throw - let the app try to connect and fail gracefully
}