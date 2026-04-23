/**
 * Privileged identity bootstrap list.
 *
 * Role assignment:
 *   info@abrahamoflondon.org     → OWNER  (sole owner, full control)
 *   seunadaramola@gmail.com      → ADMIN  (administrative access)
 *   abrahamadaramola@outlook.com → ADMIN  (administrative access)
 *
 * These emails are checked at NextAuth sign-in to assign User.role in the
 * database. The database role is the single source of truth for all access
 * checks via getUserAccess() → permissions.isAdmin / permissions.isOwner.
 */
export const BOOTSTRAP_ADMIN_EMAILS = new Set([
  "info@abrahamoflondon.org",
  "seunadaramola@gmail.com",
  "abrahamadaramola@outlook.com",
  "abrahamadaromola@yahoo.co.uk",
]);