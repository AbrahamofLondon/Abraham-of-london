// global.d.ts - Global type declarations for Abraham of London

// Disable exactOptionalPropertyTypes effects for problematic types
type RelaxedPartial<T> = {
  [P in keyof T]?: T[P] extends infer U ? U : never;
};

// Fix for Next.js dynamic imports
declare module "next/dynamic" {
  import type { ComponentType } from "react";
  
  interface DynamicOptions<P = {}> {
    loader?: () => Promise<ComponentType<P> | { default: ComponentType<P> }>;
    loading?: ComponentType<{ error?: Error; isLoading?: boolean; pastDelay?: boolean; timedOut?: boolean }>;
    ssr?: boolean;
    loadableGenerated?: {
      webpack?: () => any;
      modules?: () => string[];
    };
  }
  
  function dynamic<P = {}>(
    loader: () => Promise<ComponentType<P> | { default: ComponentType<P> }>,
    options?: DynamicOptions<P>
  ): ComponentType<P>;
  
  export default dynamic;
}

// Fix for next-mdx-remote - CORRECTED
declare module "next-mdx-remote" {
  import type { ComponentType } from "react";
  
  export interface MDXRemoteSerializeResult {
    compiledSource: string;
    scope?: Record<string, unknown>;
    frontmatter?: Record<string, unknown>;
  }
  
  // FIXED: MDXRemoteProps should spread MDXRemoteSerializeResult
  export interface MDXRemoteProps extends MDXRemoteSerializeResult {
    components?: RelaxedPartial<Record<string, ComponentType<any>>>;
    lazy?: boolean;
  }
  
  export const MDXRemote: ComponentType<MDXRemoteProps>;
  export function serialize(
    source: string,
    options?: { scope?: Record<string, unknown>; mdxOptions?: any }
  ): Promise<MDXRemoteSerializeResult>;
}

// Fix for ContentLayer
declare module "contentlayer/generated" {
  // Collections — one per contentlayer document type
  export const allDocuments: readonly Record<string, unknown>[];
  export const allPosts: readonly Record<string, unknown>[];
  export const allShorts: readonly Record<string, unknown>[];
  export const allBooks: readonly Record<string, unknown>[];
  export const allCanons: readonly Record<string, unknown>[];
  export const allBriefs: readonly Record<string, unknown>[];
  export const allVaultBriefs: readonly Record<string, unknown>[];
  export const allIntelligences: readonly Record<string, unknown>[];
  export const allDispatches: readonly Record<string, unknown>[];
  export const allDownloads: readonly Record<string, unknown>[];
  export const allEvents: readonly Record<string, unknown>[];
  export const allPrints: readonly Record<string, unknown>[];
  export const allResources: readonly Record<string, unknown>[];
  export const allStrategies: readonly Record<string, unknown>[];
  export const allLexicons: readonly Record<string, unknown>[];
  export const allVaults: readonly Record<string, unknown>[];
  export const allPlaybooks: readonly Record<string, unknown>[];

  // Named document types
  export type Post = Record<string, unknown>;
  export type Short = Record<string, unknown>;
  export type Book = Record<string, unknown>;
  export type Canon = Record<string, unknown>;
  export type Brief = Record<string, unknown>;
  export type VaultBrief = Record<string, unknown>;
  export type Intelligence = Record<string, unknown>;
  export type Dispatch = Record<string, unknown>;
  export type Download = Record<string, unknown>;
  export type Event = Record<string, unknown>;
  export type Print = Record<string, unknown>;
  export type Resource = Record<string, unknown>;
  export type Strategy = Record<string, unknown>;
  export type Lexicon = Record<string, unknown>;
  export type Vault = Record<string, unknown>;
  export type Playbook = Record<string, unknown>;
  export type DocumentTypes = Record<string, unknown>;
}

declare module "@prisma/migrate";
// Missing canvas module
declare module "canvas" {
  export function createCanvas(width: number, height: number): any;
  export function loadImage(src: string): Promise<any>;
  export function registerFont(path: string, options: { family: string }): void;
}

// Other missing modules
declare module "better-sqlite3";
declare module "archiver";
declare module "node-fetch";
declare module "ws";
declare module "rehype-autolink-headings";
declare module "rehype-external-links";
declare module "@react-email/components";
declare module "fuse.js";

// Fix recharts types for PieLabelRenderProps
declare module "recharts" {
  export interface PieLabelRenderProps {
    percent?: number;
    name?: string;
    value?: number;
    cx?: number;
    cy?: number;
    midAngle?: number;
    innerRadius?: number;
    outerRadius?: number;
    startAngle?: number;
    endAngle?: number;
    fill?: string;
    payload?: any;
    textAnchor?: string;
    x?: number;
    y?: number;
    stroke?: string;
    index?: number;
    [key: string]: any;
  }
}

// Custom types to fix component props
interface MDXComponentProps {
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}

// Fix for siteConfig
declare module "@/lib/siteConfig" {
  export const siteConfig: {
    title: string;
    description: string;
    url: string;
    brand: {
      tagline: string;
      mission: string;
    };
    contact: {
      email: string;
      phone: string;
      address: string;
    };
    socialLinks: Array<{
      kind: string;
      label: string;
      href: string;
    }>;
    navigation: any;
  };
  
  export function getPageTitle(title?: string): string;
}
