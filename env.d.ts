// env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SITE_URL: string;
    NEXT_PUBLIC_INNOVATEHUB_URL: string;
    NEXT_PUBLIC_GA_MEASUREMENT_ID: string;
    URL?: string;
    DEPLOY_PRIME_URL?: string;
  }
}
