// lib/inner-circle/index.ts - PRODUCTION BARREL EXPORT
// This file re-exports everything from the exports file
// It ensures consistent exports regardless of client/server environment

export * from './exports';
export { default } from './exports';

// For backwards compatibility, also export common constants
export { INNER_CIRCLE_CONFIG } from './exports';