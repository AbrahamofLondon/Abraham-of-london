import { z } from 'zod';

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
  DISABLE_EMAIL_SENDS: z.enum(['true', 'false']).transform(val => val === 'true').default('false'),
  DISABLE_DIAGNOSTIC_SCORING: z.enum(['true', 'false']).transform(val => val === 'true').default('false'),
  DISABLE_STRATEGY_ROOM_ENTRY: z.enum(['true', 'false']).transform(val => val === 'true').default('false'),
  DISABLE_CHECKOUT: z.enum(['true', 'false']).transform(val => val === 'true').default('false'),
  DISABLE_RETURN_BRIEFS: z.enum(['true', 'false']).transform(val => val === 'true').default('false'),
  SECURITY_LOCKDOWN_MODE: z.enum(['true', 'false']).transform(val => val === 'true').default('false'),
});

type ParsedEnv = z.infer<typeof envSchema>;

type EnvShape = ParsedEnv;

let cachedEnv: EnvShape | null = null;

function loadEnv(): EnvShape {
  if (cachedEnv) {
    return cachedEnv;
  }

  const env = envSchema.safeParse(process.env);

  if (!env.success) {
    console.error('❌ Invalid environment variables:', env.error.format());
    throw new Error('Invalid environment variables - required secrets missing');
  }

  cachedEnv = env.data;
  return cachedEnv;
}

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
        disableEmailSends: env.DISABLE_EMAIL_SENDS,
        disableDiagnosticScoring: env.DISABLE_DIAGNOSTIC_SCORING,
        disableStrategyRoomEntry: env.DISABLE_STRATEGY_ROOM_ENTRY,
        disableCheckout: env.DISABLE_CHECKOUT,
        disableReturnBriefs: env.DISABLE_RETURN_BRIEFS,
        securityLockdownMode: env.SECURITY_LOCKDOWN_MODE,
      },
    } as const;

    return config[prop as keyof typeof config];
  },
});
