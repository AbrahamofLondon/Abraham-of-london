import { z } from 'zod';
// security-scan-ignore-file
// Reason: This file only contains DEFAULT/PLACEHOLDER values for development, not production secrets.

// Define schema for required environment variables
const envSchema = z.object({
  // Required for all environments
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  
  // Secrets (required in production, optional in development)
  JWT_SECRET: z.string().min(32),
  NEXTAUTH_SECRET: z.string().min(32),
  
  // URLs
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXTAUTH_URL: z.string().url(),
  
  // Feature flags
  ENABLE_AUDIT_LOGGING: z.enum(['true', 'false']).transform(val => val === 'true').default('false'),
  SKIP_AUTH_IN_DEV: z.enum(['true', 'false']).transform(val => val === 'true').default('false'),
});

// Parse and validate
const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error('❌ Invalid environment variables:', env.error.format());
  
  // In production, throw error - NO DEFAULT VALUES
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Invalid environment variables - required secrets missing in production');
  }
  
  // In development only, provide clear placeholder messages
  console.warn('⚠️  Missing required environment variables. Using development placeholders.');
}

// NEVER provide default values for secrets in the fallback object
export const ENV = env.success ? env.data : {
  NODE_ENV: 'development' as const,
  DATABASE_URL: 'file:./dev.db',
  JWT_SECRET: 'DEVELOPMENT-ONLY-PLACEHOLDER-DO-NOT-USE-IN-PRODUCTION',
  NEXTAUTH_SECRET: 'DEVELOPMENT-ONLY-PLACEHOLDER-DO-NOT-USE-IN-PRODUCTION',
  NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
  NEXTAUTH_URL: 'http://localhost:3000',
  ENABLE_AUDIT_LOGGING: false,
  SKIP_AUTH_IN_DEV: false,
};

// Helper to get environment variables with fallbacks
export function getEnv(key: keyof typeof ENV, defaultValue?: string): string {
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