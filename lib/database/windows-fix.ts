// lib/database/windows-fix.ts
import mongoose, { type ConnectOptions } from "mongoose";

// Windows-specific mongoose connection settings
export const mongooseOptions: ConnectOptions = {
  bufferCommands: false,
  autoIndex: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  family: 4, // Use IPv4, skip trying IPv6 (Windows issue)
};

// Special handling for Windows environment
if (process.env.IS_WINDOWS === "true" || process.platform === "win32") {
  mongooseOptions.maxPoolSize = 5; // Lower pool size for Windows
  mongooseOptions.serverSelectionTimeoutMS = 60000; // Longer timeout
}