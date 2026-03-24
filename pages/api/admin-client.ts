/* lib/api/admin-client.ts — Secure Admin Fetch Wrapper */

/**
 * Enhanced fetch wrapper for Institutional Administrative Actions.
 * Includes automatic trace propagation and isomorphic safety.
 */
export async function adminFetch(endpoint: string, options: RequestInit = {}) {
  // Generate a temporary trace ID for this request cycle if not provided
  const traceId = `trace_${Math.random().toString(36).substring(2, 11)}`;

  const defaultOptions: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Institutional-Action": "true", // Custom header for WAF filtering
      "X-Directorate-Trace-ID": traceId, // Correlates logs with the logging.ts service
      ...options.headers,
    },
  };

  try {
    const response = await fetch(endpoint, defaultOptions);

    // 1. Handle Security Deviations (401/403)
    if (response.status === 401 || response.status === 403) {
      // Isomorphic check to prevent 'window is not defined' during build/SSR
      if (typeof window !== 'undefined') {
        window.location.href = "/inner-circle/insufficient-clearance";
      }
      throw new Error("SEC_REVOKED: Administrative Clearance Insufficient");
    }

    // 2. Handle API Errors
    if (!response.ok) {
      // Graceful JSON parsing to avoid crashing on empty error bodies
      const errorData = await response.json().catch(() => ({ 
        message: "Protocol Error: Node Unresponsive" 
      }));
      
      throw new Error(errorData.message || "Administrative Request Failed");
    }

    return response;
  } catch (error) {
    // Log the error via the trace ID for backend correlation
    console.error(`[ADMIN_FETCH_FAILURE] [${traceId}]`, error);
    throw error;
  }
}