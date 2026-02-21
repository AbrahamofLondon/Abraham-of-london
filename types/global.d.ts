/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="./downloads.d.ts" />
/// <reference path="./nav.d.ts" />
/// <reference path="./site.d.ts" />
/// <reference path="./post.d.ts" />
/// <reference path="./event.d.ts" />
/// <reference path="./print.d.ts" />

import type * as React from "react";

// ==================== MODULE DECLARATIONS (TOP-LEVEL) ====================

// Fuse.js
declare module "fuse.js";

// WebSocket
declare module "ws";

// Rehype plugins
declare module "rehype-autolink-headings";
declare module "rehype-external-links";

// React Email
declare module "@react-email/components";

// ==================== ASSET MODULES (TOP-LEVEL) ====================

declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}

declare module "*.module.scss" {
  const classes: Record<string, string>;
  export default classes;
}

declare module "*.png" {
  const value: string;
  export default value;
}
declare module "*.jpg" {
  const value: string;
  export default value;
}
declare module "*.jpeg" {
  const value: string;
  export default value;
}
declare module "*.webp" {
  const value: string;
  export default value;
}
declare module "*.gif" {
  const value: string;
  export default value;
}

declare module "*.svg" {
  const value: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default value;
}

declare module "*.woff";
declare module "*.woff2";
declare module "*.ttf";
declare module "*.eot";
declare module "*.otf";

// ==================== GLOBAL AUGMENTATIONS ====================

declare global {
  type Nullable<T> = T | null;
  type Optional<T> = T | undefined;
  type Maybe<T> = T | null | undefined;
  type AnyRecord = Record<string, any>;

  interface ReactChildren {
    children: React.ReactNode;
  }

  interface Window {
    gtag?: (command: string, action: string, params?: Record<string, unknown>) => void;
    dataLayer?: unknown[];
    plausible?: (event: string, options?: { props: Record<string, any> }) => void;
  }

  interface APIResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
  }

  interface PageParams {
    page?: number;
    limit?: number;
    sort?: string;
    order?: "asc" | "desc";
  }

  interface SearchParams {
    q?: string;
    category?: string;
    tag?: string;
    author?: string;
    dateFrom?: string;
    dateTo?: string;
  }

  interface RateLimitResult {
    limited: boolean;
    retryAfter: number;
    limit: number;
    remaining: number;
  }

  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production" | "test";
      DATABASE_URL: string;

      INNER_CIRCLE_JWT_SECRET: string;
      ADMIN_API_KEY: string;
      NEXTAUTH_SECRET: string;
      NEXTAUTH_URL: string;

      SITE_URL: string;
      NEXT_PUBLIC_SITE_URL?: string;

      ANALYTICS_ID?: string;
      NEXT_PUBLIC_GA_ID?: string;
      NEXT_PUBLIC_GA_MEASUREMENT_ID?: string;
      ANALYTICS_WEBHOOK_URL?: string;

      NEXT_PUBLIC_INNOVATEHUB_URL?: string;
      NEXT_PUBLIC_INNOVATEHUB_ALT_URL?: string;
      NEXT_PUBLIC_ALOMARADA_URL?: string;
      NEXT_PUBLIC_ENDURELUXE_URL?: string;

      RESEND_API_KEY?: string;

      PRISMA_QUERY_ENGINE_LIBRARY?: string;
      PRISMA_CLIENT_ENGINE_TYPE?: string;
    }
  }
}

export {};