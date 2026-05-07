// lib/config/runtime.ts

export const runtimeConfig = {
  appUrl:
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    "http://localhost:3000",

  siteName: "Abraham of London",

  vault: {
    rootPrefix: "/private/vault",
  },

  pdf: {
    publicDir: "private_storage/premium-content/assets/downloads",
  },
} as const;

export default runtimeConfig;
