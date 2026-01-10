// lib/env.ts
import { z } from 'zod';

// Define schema for required environment variables
const envSchema = z.object({
  // Required for all environments
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  
  // Secrets (required in production, optional in development)
  JWT_SECRET: z.string().min(32).optional().default('dev-secret-change-in-production'),
  NEXTAUTH_SECRET: z.string().min(32).optional().default('dev-nextauth-secret'),
  
  // URLs
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXTAUTH_URL: z.string().url(),
  
  // Feature flags
  ENABLE_AUDIT_LOGGING: z.enum(['true', 'false']).transform(val => val === 'true'),
  SKIP_AUTH_IN_DEV: z.enum(['true', 'false']).transform(val => val === 'true'),
});

// Parse and validate
const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error('❌ Invalid environment variables:', env.error.format());
  
  // In production, throw error
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Invalid environment variables');
  }
  
  // In development, use defaults with warnings
  console.warn('⚠️ Using default values for missing environment variables');
}

export const ENV = env.success ? env.data : {
  NODE_ENV: 'development' as const,
  DATABASE_URL: 'file:./dev.db',
  JWT_SECRET: 'dev-secret-change-me',
  NEXTAUTH_SECRET: 'dev-nextauth-secret-change-me',
  NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
  NEXTAUTH_URL: 'http://localhost:3000',
  ENABLE_AUDIT_LOGGING: true,
  SKIP_AUTH_IN_DEV: true,
};

// Helper to get environment variables with fallbacks
export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  
  if (value === undefined && defaultValue === undefined) {
    console.warn(`⚠️ Environment variable ${key} is not set`);
  }
  
  return value || defaultValue || '';
}

// Type-safe environment variables
export const Config = {
  isDevelopment: ENV.NODE_ENV === 'development',
  isProduction: ENV.NODE_ENV === 'production',
  isTest: ENV.NODE_ENV === 'test',
  
  database: {
    url: ENV.DATABASE_URL,
  },
  
  auth: {
    jwtSecret: ENV.JWT_SECRET,
    nextAuthSecret: ENV.NEXTAUTH_SECRET,
    siteUrl: ENV.NEXT_PUBLIC_SITE_URL,
    nextAuthUrl: ENV.NEXTAUTH_URL,
  },
  
  features: {
    auditLogging: ENV.ENABLE_AUDIT_LOGGING,
    skipAuthInDev: ENV.SKIP_AUTH_IN_DEV,
  },
} as const;

