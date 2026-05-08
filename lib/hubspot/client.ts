/**
 * lib/hubspot/client.ts — Authenticated HubSpot API client
 *
 * All HubSpot API calls go through this module.
 * Uses the HubSpot v3 REST API with a private app access token.
 */

const HUBSPOT_BASE = "https://api.hubapi.com";

function getAccessToken(): string | null {
  const token = String(process.env.HUBSPOT_ACCESS_TOKEN || "").trim();
  return token || null;
}

export function isHubSpotConfigured(): boolean {
  return Boolean(getAccessToken());
}

export async function hubspotFetch<T = unknown>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    body?: Record<string, unknown>;
  } = {},
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  const token = getAccessToken();
  if (!token) {
    return { ok: false, status: 0, error: "HUBSPOT_NOT_CONFIGURED" };
  }

  const { method = "GET", body } = options;

  try {
    const res = await fetch(`${HUBSPOT_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, status: res.status, error: text.slice(0, 500) };
    }

    const data = (await res.json().catch(() => ({}))) as T;
    return { ok: true, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown fetch error";
    return { ok: false, status: 0, error: msg };
  }
}
