// lib/premium/token-validation.ts
/**
 * Validates token ID format and structure
 */
export function validateTokenId(tokenId: string): { valid: boolean; error?: string } {
  if (!tokenId) {
    return { valid: false, error: "Token ID is required" };
  }

  // Check if it's a token format (starts with tok_)
  const tokenPattern = /^tok_[a-f0-9]{48}$/;
  
  // Check if it's a UUID format (for backward compatibility)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  // Check if it's a CUID format
  const cuidPattern = /^c[^\s-]{8,}$/;

  if (tokenPattern.test(tokenId) || uuidPattern.test(tokenId) || cuidPattern.test(tokenId)) {
    return { valid: true };
  }

  return { 
    valid: false, 
    error: "Invalid token ID format. Expected token ID (tok_*), UUID, or CUID." 
  };
}

/**
 * Sanitizes token ID for logging (shows only prefix)
 */
export function sanitizeTokenId(tokenId: string): string {
  if (!tokenId) return '';
  if (tokenId.length <= 8) return '***';
  
  // Show first 8 chars for tokens
  if (tokenId.startsWith('tok_')) {
    return tokenId.substring(0, 12) + '...';
  }
  
  return tokenId.substring(0, 8) + '...';
}

/**
 * Extracts metadata from token ID (if encoded)
 */
export function extractTokenMetadata(tokenId: string): Record<string, string> {
  const metadata: Record<string, string> = {};
  
  try {
    // If token has encoded metadata after --
    if (tokenId.includes('--')) {
      const [, encoded] = tokenId.split('--');
      if (encoded) {
        const pairs = encoded.split('&');
        for (const pair of pairs) {
          const [key, value] = pair.split('=');
          if (key && value) {
            metadata[decodeURIComponent(key)] = decodeURIComponent(value);
          }
        }
      }
    }
  } catch {
    // Ignore parsing errors
  }

  return metadata;
}