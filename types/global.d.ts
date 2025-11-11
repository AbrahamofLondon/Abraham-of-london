/* eslint-disable @typescript-eslint/triple-slash-reference */
// types/global.d.ts
/// <reference path="./downloads.d.ts" />
/// <reference path="./nav.d.ts" />
/// <reference path="./site.d.ts" />
/// <reference path="./post.d.ts" />

declare global {
  // Global utility types
  type Nullable<T> = T | null;
  type Optional<T> = T | undefined;
  type Maybe<T> = T | null | undefined;

  // Common React types
  interface ReactChildren {
    children: React.ReactNode;
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

  // Environment variables (extended with your actual env vars)
  namespace NodeJS {
    interface ProcessEnv {
      // Node Environment
      NODE_ENV: "development" | "production" | "test";

      // Site Configuration
      SITE_URL: string;
      NEXT_PUBLIC_SITE_URL?: string;

      // Analytics
      ANALYTICS_ID?: string;
      NEXT_PUBLIC_GA_ID?: string;

      // Brand URLs
      NEXT_PUBLIC_INNOVATEHUB_URL?: string;
      NEXT_PUBLIC_INNOVATEHUB_ALT_URL?: string;
      NEXT_PUBLIC_ALOMARADA_URL?: string;
      NEXT_PUBLIC_ENDURELUXE_URL?: string;

      // API Keys (optional)
      NEXT_PUBLIC_SOME_API_KEY?: string;

      // Feature Flags
      NEXT_PUBLIC_ENABLE_FEATURE_X?: string;
      NEXT_PUBLIC_ENABLE_FEATURE_Y?: string;
    }
  }

  // Framer Motion type fixes
  declare module "framer-motion" {
    export * from "framer-motion/dist/index";
  }

  // ContentLayer type fixes
  declare module "contentlayer/core" {
    export * from "contentlayer/core/dist/index";
  }

  // Next.js Font type fixes
  declare module "next/font/google" {
    export * from "next/font/google/dist/index";
  }

  declare module "next/font/local" {
    export * from "next/font/local/dist/index";
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
    const value: string;
    export default value;
  }

  declare module "*.webp" {
    const value: string;
    export default value;
  }
}

// This export is required for global type modifications
export {};
