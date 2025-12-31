/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="./downloads.d.ts" />
/// <reference path="./nav.d.ts" />
/// <reference path="./site.d.ts" />
/// <reference path="./post.d.ts" />
/// <reference path="./event.d.ts" />
/// <reference path="./print.d.ts" />

declare global {
  // Global utility types
  type Nullable<T> = T | null;
  type Optional<T> = T | undefined;
  type Maybe<T> = T | null | undefined;
  type AnyRecord = Record<string, any>;

  // Common React types
  interface ReactChildren {
    children: React.ReactNode;
  }

  // Analytics global declarations
  interface Window {
    gtag?: (
      command: string,
      action: string,
      params?: Record<string, unknown>
    ) => void;
    dataLayer: unknown[];
    plausible?: (
      event: string,
      options?: { props: Record<string, any> }
    ) => void;
  }

  // API response types
  interface APIResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
  }

  // Pagination params
  interface PageParams {
    page?: number;
    limit?: number;
    sort?: string;
    order?: "asc" | "desc";
  }

  // Search params
  interface SearchParams {
    q?: string;
    category?: string;
    tag?: string;
    author?: string;
    dateFrom?: string;
    dateTo?: string;
  }

  // ContentLayer Types
  type ContentType = 'post' | 'book' | 'event' | 'print' | 'resource';
  
  interface ContentDoc {
    _id: string;
    _raw: {
      sourceFilePath: string;
      sourceFileName: string;
      sourceFileDir: string;
      contentType: string;
      flattenedPath: string;
    };
    type: ContentType;
    title: string;
    slug: string;
    description?: string;
    excerpt?: string;
    date?: string;
    tags?: string[];
    featured?: boolean;
    draft?: boolean;
    published?: boolean;
  }

  // Rate limit types
  interface RateLimitResult {
    limited: boolean;
    retryAfter: number;
    limit: number;
    remaining: number;
  }

  // Missing module declarations
  declare module "..." {
    export const useTheme: any;
    export const motion: any;
    export const useRouter: any;
    export const safePostProp: any;
    export const safeString: any;
    export const getFontClasses: any;
    export const fontPresets: any;
    export const siteConfig: any;
    export const usePathname: any;
    export const GetStaticProps: any;
    export const GetStaticPaths: any;
    export const InferGetStaticPropsType: any;
    export const allResources: any;
    export const components: any;
    export const useMDXComponent: any;
    export const safeReadMdx: any;
    export const z: any;
    export const inter: any;
    export const playfair: any;
    export const jetbrainsMono: any;
    export const sourceSerif: any;
    export const spaceGrotesk: any;
    export const customFont: any;
    export const useEffect: any;
    export const useCallback: any;
    export const useRef: any;
    export const useState: any;
    export const NextRequest: any;
    export const NextResponse: any;
  }

  // Netlify Functions
  declare module "@netlify/functions" {
    export interface Handler {
      (event: any, context?: any): Promise<any>;
    }
    export interface HandlerResponse {
      statusCode: number;
      body?: string;
      headers?: Record<string, string>;
    }
  }

  // External libraries
  declare module "fuse.js";
  declare module "ws";
  declare module "rehype-autolink-headings";
  declare module "rehype-external-links";
  declare module "@react-email/components";

  // Environment variables (extended with your actual env vars)
  namespace NodeJS {
    interface ProcessEnv {
      // Node Environment
      NODE_ENV: "development" | "production" | "test";

      // Database
      DATABASE_URL: string;

      // Authentication
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

      // Brand URLs
      NEXT_PUBLIC_INNOVATEHUB_URL?: string;
      NEXT_PUBLIC_INNOVATEHUB_ALT_URL?: string;
      NEXT_PUBLIC_ALOMARADA_URL?: string;
      NEXT_PUBLIC_ENDURELUXE_URL?: string;

      // Email
      RESEND_API_KEY?: string;

      // API Keys (optional)
      NEXT_PUBLIC_SOME_API_KEY?: string;

      // Feature Flags
      NEXT_PUBLIC_ENABLE_FEATURE_X?: string;
      NEXT_PUBLIC_ENABLE_FEATURE_Y?: string;

      // Development
      PRISMA_QUERY_ENGINE_LIBRARY?: string;
      PRISMA_CLIENT_ENGINE_TYPE?: string;
    }
  }

  // CSS modules
  declare module "*.module.css" {
    const classes: { [key: string]: string };
    export default classes;
  }

  declare module "*.module.scss" {
    const classes: { [key: string]: string };
    export default classes;
  }

  // Image formats
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

  declare module "*.svg" {
    const value: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
    export default value;
  }

  declare module "*.webp" {
    const value: string;
    export default value;
  }

  // Font formats
  declare module "*.woff";
  declare module "*.woff2";
  declare module "*.ttf";
  declare module "*.eot";
}

// This export is required for global type modifications
export {};