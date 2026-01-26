// lib/server/content.ts
/**
 * Server-side content utilities (legacy compatibility)
 */

// Re-export from content/server.ts
export {
  isPublished,
  toUiDoc,
  resolveDocDownloadUrl,
  getAccessLevel
} from '../content/server';