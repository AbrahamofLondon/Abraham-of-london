/**
 * lib/auth/token.ts — NEUTRALIZED
 *
 * Previously stored access tokens in localStorage. This is a security risk
 * (XSS exfiltration, client-side authority).
 *
 * Now: functions are no-ops. The server session (via NextAuth JWT) is the
 * sole authority. These exports are preserved to avoid breaking 58+ importers.
 *
 * Access checks must use getUserAccess() server-side or useSession() client-side.
 * Never store tokens in localStorage.
 */

export const ACCESS_TOKEN_KEY = "aol_access_token";

/** @deprecated Use server session. Returns null (no client-side token storage). */
export function getAccessToken(): string | null {
  return null;
}

/** @deprecated No-op. Tokens are not stored client-side. */
export function setAccessToken(_token: string): void {
  // Intentional no-op — server session is the authority
}

/** @deprecated No-op. Nothing to clear. */
export function clearAccessToken(): void {
  // Clean up any legacy localStorage data
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem("innerCircleToken");
      localStorage.removeItem("innerCircleUser");
    } catch {
      // ignore
    }
  }
}
