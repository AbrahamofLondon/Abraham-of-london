export async function adminFetch(endpoint: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Required by proxy.ts step 6: all /api/admin/* mutations need this header.
  headers.set("X-Institutional-Action", "true");

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`[ADMIN_API_ERROR] ${response.status}: ${errorData.error || "Unknown"}`);
  }

  return response;
}
