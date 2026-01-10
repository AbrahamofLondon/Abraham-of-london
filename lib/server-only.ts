// lib/server-only.ts - Utility to prevent server code from being imported on client
export function ensureServerOnly() {
  if (typeof window !== 'undefined') {
    throw new Error('This module can only be used on the server');
  }
}

export function serverOnly<T>(value: T): T {
  if (typeof window !== 'undefined') {
    throw new Error('This function can only be used on the server');
  }
  return value;
}

// Use this in your redis-enhanced.node.ts:
// import { ensureServerOnly } from '@/lib/server-only';
// ensureServerOnly();