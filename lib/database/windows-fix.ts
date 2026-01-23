// lib/database/windows-fix.ts
import mongoose from 'mongoose';

// Windows-specific mongoose connection settings
const mongooseOptions: mongoose.ConnectOptions = {
  bufferCommands: false,
  autoIndex: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  family: 4, // Use IPv4, skip trying IPv6 (Windows issue)
  keepAlive: true,
  keepAliveInitialDelay: 300000,
  heartbeatFrequencyMS: 10000,
};

// Special handling for Windows environment
if (process.env.IS_WINDOWS === 'true') {
  mongooseOptions.maxPoolSize = 5; // Lower pool size for Windows
  mongooseOptions.serverSelectionTimeoutMS = 60000; // Longer timeout
}