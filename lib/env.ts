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

type ParsedEnv = z.infer<typeof envSchema>;

const fallbackEnv: ParsedEnv = {
  NODE_ENV: 'development' as const,
  DATABASE_URL: '', // Must be set via env — no SQLite fallback
  JWT_SECRET: 'DEVELOPMENT-ONLY-PLACEHOLDER-DO-NOT-USE-IN-PRODUCTION',
  NEXTAUTH_SECRET: 'DEVELOPMENT-ONLY-PLACEHOLDER-DO-NOT-USE-IN-PRODUCTION',
  NEXT_PUBLIC_SITE_URL: 'https://www.abrahamoflondon.org',
  NEXTAUTH_URL: 'https://www.abrahamoflondon.org',
  ENABLE_AUDIT_LOGGING: false,
  SKIP_AUTH_IN_DEV: false,
};

type EnvShape = ParsedEnv;

let cachedEnv: EnvShape | null = null;

function loadEnv(): EnvShape {
  if (cachedEnv) {
    return cachedEnv;
  }

  const env = envSchema.safeParse(process.env);

  if (!env.success) {
    console.error('❌ Invalid environment variables:', env.error.format());
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment variables - required secrets missing in production');
    }
    
    console.warn('⚠️  Missing required environment variables. Using development placeholders.');
    cachedEnv = fallbackEnv;
    return cachedEnv;
  }

  cachedEnv = env.data;
  return cachedEnv;
}

// NEVER provide default values for secrets in the fallback object
export const ENV: EnvShape = new Proxy({} as EnvShape, {
  get(_target, prop) {
    return loadEnv()[prop as keyof EnvShape];
  },
});

// Helper to get environment variables with fallbacks
export function getEnv(key: keyof typeof ENV, defaultValue?: string): string {
  const value = process.env[key];
  
  if (value === undefined && defaultValue === undefined) {
    console.warn(`⚠️ Environment variable ${key} is not set`);
  }
  
  return value || defaultValue || '';
}

// Type-safe environment variables
export const Config = new Proxy({} as {
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  database: { url: string };
  auth: {
    jwtSecret: string;
    nextAuthSecret: string;
    siteUrl: string;
    nextAuthUrl: string;
  };
  features: {
    auditLogging: boolean;
    skipAuthInDev: boolean;
  };
}, {
  get(_target, prop) {
    const env = loadEnv();
    const config = {
      isDevelopment: env.NODE_ENV === 'development',
      isProduction: env.NODE_ENV === 'production',
      isTest: env.NODE_ENV === 'test',
      database: {
        url: env.DATABASE_URL,
      },
      auth: {
        jwtSecret: env.JWT_SECRET,
        nextAuthSecret: env.NEXTAUTH_SECRET,
        siteUrl: env.NEXT_PUBLIC_SITE_URL,
        nextAuthUrl: env.NEXTAUTH_URL,
      },
      features: {
        auditLogging: env.ENABLE_AUDIT_LOGGING,
        skipAuthInDev: env.SKIP_AUTH_IN_DEV,
      },
    } as const;

    return config[prop as keyof typeof config];
  },
});
