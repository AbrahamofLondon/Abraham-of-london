/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="./downloads.d.ts" />
/// <reference path="./nav.d.ts" />
/// <reference path="./site.d.ts" />
/// <reference path="./post.d.ts" />
/// <reference path="./event.d.ts" />
/// <reference path="./print.d.ts" />

declare global {
  // ==================== UTILITY TYPES ====================
  type Nullable<T> = T | null;
  type Optional<T> = T | undefined;
  type Maybe<T> = T | null | undefined;
  type AnyRecord = Record<string, any>;

  // ==================== REACT TYPES ====================
  interface ReactChildren {
    children: React.ReactNode;
  }

  // ==================== GLOBAL WINDOW EXTENSIONS ====================
  interface Window {
    // Google Analytics
    gtag?: (
      command: string,
      action: string,
      params?: Record<string, unknown>
    ) => void;
    dataLayer?: unknown[];
    
    // Plausible Analytics
    plausible?: (
      event: string,
      options?: { props: Record<string, any> }
    ) => void;
  }

  // ==================== API TYPES ====================
  interface APIResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
  }

  // ==================== PAGINATION & SEARCH ====================
  interface PageParams {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }

  interface SearchParams {
    q?: string;
    category?: string;
    tag?: string;
    author?: string;
    dateFrom?: string;
    dateTo?: string;
  }

  // ==================== RATE LIMITING ====================
  interface RateLimitResult {
    limited: boolean;
    retryAfter: number;
    limit: number;
    remaining: number;
  }

  // ==================== MODULE DECLARATIONS ====================
  
  // Fuse.js
  declare module 'fuse.js';
  
  // WebSocket
  declare module 'ws';
  
  // Rehype plugins
  declare module 'rehype-autolink-headings';
  declare module 'rehype-external-links';
  
  // React Email
  declare module '@react-email/components';

  // ==================== ENVIRONMENT VARIABLES ====================
  namespace NodeJS {
    interface ProcessEnv {
      // Core Environment
      NODE_ENV: 'development' | 'production' | 'test';
      DATABASE_URL: string;

      // Authentication & Security
      INNER_CIRCLE_JWT_SECRET: string;
      ADMIN_API_KEY: string;
      NEXTAUTH_SECRET: string;
      NEXTAUTH_URL: string;

      // Site Configuration
      SITE_URL: string;
      NEXT_PUBLIC_SITE_URL?: string;

      // Analytics
      ANALYTICS_ID?: string;
      NEXT_PUBLIC_GA_ID?: string;
      NEXT_PUBLIC_GA_MEASUREMENT_ID?: string;
      ANALYTICS_WEBHOOK_URL?: string;

      // Venture URLs
      NEXT_PUBLIC_INNOVATEHUB_URL?: string;
      NEXT_PUBLIC_INNOVATEHUB_ALT_URL?: string;
      NEXT_PUBLIC_ALOMARADA_URL?: string;
      NEXT_PUBLIC_ENDURELUXE_URL?: string;

      // Email Service
      RESEND_API_KEY?: string;

      // Development
      PRISMA_QUERY_ENGINE_LIBRARY?: string;
      PRISMA_CLIENT_ENGINE_TYPE?: string;
    }
  }

  // ==================== ASSET MODULES ====================
  
  // CSS Modules
  declare module '*.module.css' {
    const classes: { [key: string]: string };
    export default classes;
  }

  declare module '*.module.scss' {
    const classes: { [key: string]: string };
    export default classes;
  }

  // Image Formats
  declare module '*.png' {
    const value: string;
    export default value;
  }

  declare module '*.jpg' {
    const value: string;
    export default value;
  }

  declare module '*.jpeg' {
    const value: string;
    export default value;
  }

  declare module '*.svg' {
    import React from 'react';
    const value: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
    export default value;
  }

  declare module '*.webp' {
    const value: string;
    export default value;
  }

  declare module '*.gif' {
    const value: string;
    export default value;
  }

  // Font Formats
  declare module '*.woff';
  declare module '*.woff2';
  declare module '*.ttf';
  declare module '*.eot';
  declare module '*.otf';
}

// Empty export to make this a module
export {};