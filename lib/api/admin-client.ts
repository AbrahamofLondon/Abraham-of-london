/* lib/api/admin-client.ts — Enhanced Fetch Wrapper */

export async function adminFetch(endpoint: string, options: RequestInit = {}) {
  // Admin auth is handled server-side via NextAuth session.
  // The x-inner-circle-admin-key header pattern has been removed
  // as it stored admin credentials in sessionStorage (XSS risk).
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  // Global error logging for 4xx/5xx responses
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`[ADMIN_API_ERROR] ${response.status}: ${errorData.error || 'Unknown'}`);
    
    if (response.status === 401) {
      // Logic for session expiration
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("inner_circle_admin_key");
      }
    }
  }

  return response;
}