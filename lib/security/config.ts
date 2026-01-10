// lib/security/config.ts
export interface SecurityConfig {
  jwt: {
    secret: string;
    expiresIn: string;
    algorithm: string;
  };
  api: {
    rateLimit: {
      windowMs: number;
      maxRequests: number;
    };
    allowedOrigins: string[];
  };
  cookies: {
    secure: boolean;
    httpOnly: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    maxAge: number;
  };
}

class SecurityConfiguration {
  private static instance: SecurityConfiguration;
  private config: SecurityConfig;
  
  private constructor() {
    this.config = this.loadConfig();
  }
  
  static getInstance(): SecurityConfiguration {
    if (!SecurityConfiguration.instance) {
      SecurityConfiguration.instance = new SecurityConfiguration();
    }
    return SecurityConfiguration.instance;
  }
  
  private loadConfig(): SecurityConfig {
    return {
      jwt: {
        secret: process.env.INNER_CIRCLE_JWT_SECRET || 'fallback-secret-change-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        algorithm: process.env.JWT_ALGORITHM || 'HS256',
      },
      api: {
        rateLimit: {
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
          maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
        },
        allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
      },
      cookies: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    };
  }
  
  getConfig(): SecurityConfig {
    return this.config;
  }
  
  validate(): boolean {
    const errors: string[] = [];
    
    if (!this.config.jwt.secret || this.config.jwt.secret === 'fallback-secret-change-in-production') {
      errors.push('JWT secret is not properly configured');
    }
    
    if (this.config.api.allowedOrigins.length === 0) {
      errors.push('No allowed origins configured');
    }
    
    if (errors.length > 0) {
      console.error('❌ Security configuration errors:', errors);
      return false;
    }
    
    return true;
  }
}

export default SecurityConfiguration;

