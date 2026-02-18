/* ============================================================================
 * SOVEREIGN CONTENT ENGINE [CLIENT-SAFE] — HARDENED v2.0
 * ============================================================================ */

import { UserRole, ROLE_HIERARCHY } from "@/types/auth";

export type { UserRole };

// Document classification levels mapped to UserRole requirements
export type ContentClassification =
  | "public" // Anyone can view
  | "member" // Requires member role
  | "inner-circle" // Requires inner-circle role
  | "restricted" // Requires admin role
  | "private" // Requires admin role (alias for restricted)
  | "confidential" // Requires founder role
  | "top-secret"; // Requires founder role

/**
 * Normalizes classification from frontmatter/DB to our UserRole system
 * with comprehensive fallback and validation
 */
export function getRequiredRole(doc: unknown): UserRole {
  // Guard against null/undefined
  if (!doc || typeof doc !== "object") {
    return "guest";
  }

  // Safely access classification with multiple fallbacks
  const rawClassification =
    (doc as any).classification ||
    (doc as any).accessLevel ||
    (doc as any).tier ||
    (doc as any).security ||
    "public";

  const classification = String(rawClassification).toLowerCase().trim();

  // Comprehensive classification mapping
  switch (classification) {
    // Public access
    case "public":
    case "open":
    case "unclassified":
      return "guest";

    // Member access
    case "member":
    case "members":
    case "premium":
    case "subscriber":
      return "member";

    // Inner circle access
    case "inner-circle":
    case "innercircle":
    case "circle":
    case "inner":
      return "inner-circle";

    // Restricted access (admin required)
    case "restricted":
    case "private":
    case "sensitive":
    case "protected":
    case "admin":
    case "director":
      return "admin";

    // Confidential access (founder only)
    case "confidential":
    case "top-secret":
    case "secret":
    case "founder":
    case "executive":
      return "founder";

    // Default fallback
    default:
      return "guest";
  }
}

/**
 * Core Logic: Can this specific role see this specific document?
 * With edge case handling and optional debug logging
 */
export function canAccessDoc(
  doc: unknown,
  userRole: UserRole = "guest",
  options?: { debug?: boolean }
): boolean {
  try {
    const requiredRole = getRequiredRole(doc);

    const userWeight = ROLE_HIERARCHY[userRole] ?? 0;
    const requiredWeight = ROLE_HIERARCHY[requiredRole] ?? 0;

    const hasAccess = userWeight >= requiredWeight;

    if (options?.debug) {
      console.debug("[Access]", {
        doc: (doc as any)?.title || (doc as any)?.slug || "unknown",
        userRole,
        requiredRole,
        userWeight,
        requiredWeight,
        hasAccess,
      });
    }

    return hasAccess;
  } catch (error) {
    // Log error but fail safe - deny access
    console.error("[Access] Error checking document access:", error);
    return false;
  }
}

/**
 * Check if document is publicly accessible
 */
export function isPublic(doc: unknown): boolean {
  return getRequiredRole(doc) === "guest";
}

/**
 * Check if document requires any authentication at all
 */
export function requiresAuth(doc: unknown): boolean {
  return getRequiredRole(doc) !== "guest";
}

/**
 * Get all roles that can access this document
 */
export function getAccessibleRoles(doc: unknown): UserRole[] {
  const requiredRole = getRequiredRole(doc);

  // Return all roles that have sufficient hierarchy
  return Object.entries(ROLE_HIERARCHY)
    .filter(([_, weight]) => weight >= (ROLE_HIERARCHY[requiredRole] ?? 0))
    .map(([role]) => role as UserRole);
}

/**
 * Get minimum required role for this document
 */
export function getMinimumRequiredRole(doc: unknown): UserRole {
  return getRequiredRole(doc);
}

/**
 * Validate if a document has valid access configuration
 */
export function validateDocumentAccess(doc: unknown): {
  valid: boolean;
  requiredRole: UserRole;
  issues?: string[];
} {
  const issues: string[] = [];

  try {
    const requiredRole = getRequiredRole(doc);

    // Check if required role exists in hierarchy
    if (!(requiredRole in ROLE_HIERARCHY)) {
      issues.push(`Required role '${requiredRole}' not found in hierarchy`);
    }

    return {
      valid: issues.length === 0,
      requiredRole,
      issues: issues.length > 0 ? issues : undefined,
    };
  } catch (error) {
    return {
      valid: false,
      requiredRole: "guest",
      issues: [`Validation error: ${error}`],
    };
  }
}

// Convenience exports
export const AccessEngine = {
  getRequiredRole,
  canAccessDoc,
  isPublic,
  requiresAuth,
  getAccessibleRoles,
  getMinimumRequiredRole,
  validateDocumentAccess,
};

export default AccessEngine;