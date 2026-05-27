"use client";

// No export const dynamic here — this page is a pure client-side shell.
// useEffect fetches /api/integrations/status at runtime; the HTML shell is
// identical on every request so static prerendering (○) is correct.
// Adding force-dynamic to a 'use client' page causes Vercel's packager to
// expect a Lambda that doesn't exist (the page is prerendered as static).

/**
 * app/settings/integrations/page.tsx
 * Settings page for managing OAuth integrations.
 * Users can connect/disconnect Google Calendar and Slack.
 * Shows connection status and last sync time for each provider.
 */

import * as React from "react";
import { initiateOAuth } from "@/lib/integrations/client";
import type { ProviderType } from "@/lib/integrations/client";
import { formatRelative } from "@/utils/dates";

// ─── Types ────────────────────────────────────────────────────────────────────

interface IntegrationStatus {
  provider: ProviderType;
  status: string;
  scopes: string;
  lastSyncAt: string | null;
}

interface PageProps {
  searchParams: Promise<{ success?: string; error?: string }>;
}

// ─── Provider Display Config ──────────────────────────────────────────────────

const PROVIDER_CONFIG: Record<ProviderType, { label: string; description: string; icon: string }> = {
  google: {
    label: "Google Calendar",
    description: "Sync meeting data to verify commitment completion and attendance patterns.",
    icon: "📅",
  },
  slack: {
    label: "Slack",
    description: "Monitor responsiveness and engagement signals from workspace activity.",
    icon: "💬",
  },
  jira: { label: "Jira", description: "Track task closure rates and sprint velocity.", icon: "📋" },
  linear: { label: "Linear", description: "Monitor issue resolution and project progress.", icon: "⚡" },
  github: { label: "GitHub", description: "Track PR merge frequency and code activity.", icon: "🐙" },
  notion: { label: "Notion", description: "Monitor document activity and collaboration signals.", icon: "📝" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntegrationsSettingsPage({ searchParams }: PageProps) {
  const [integrations, setIntegrations] = React.useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Handle URL query params for OAuth callback results
  React.useEffect(() => {
    async function handleParams() {
      const params = await searchParams;
      if (params.success === "google_calendar") {
        setMessage({ type: "success", text: "Google Calendar connected successfully." });
      } else if (params.success === "slack") {
        setMessage({ type: "success", text: "Slack connected successfully." });
      } else if (params.error) {
        const errorMessages: Record<string, string> = {
          access_denied: "You denied the authorization request.",
          csrf_mismatch: "Security verification failed. Please try again.",
          not_authenticated: "You must be signed in to connect integrations.",
          token_exchange_failed: "Failed to exchange authorization code. Please try again.",
          missing_authorization_code: "No authorization code received from provider.",
          no_user_identifier: "Could not identify your user account.",
        };
        setMessage({
          type: "error",
          text: errorMessages[params.error] || `Connection failed: ${params.error}`,
        });
      }
    }
    handleParams();
  }, [searchParams]);

  // Fetch current integration statuses
  React.useEffect(() => {
    async function loadIntegrations() {
      try {
        const response = await fetch("/api/integrations/status");
        if (response.ok) {
          const data = await response.json();
          setIntegrations(data);
        }
      } catch {
        // Silently fail — user may not be authenticated
      } finally {
        setLoading(false);
      }
    }
    loadIntegrations();
  }, []);

  const isConnected = (provider: ProviderType) =>
    integrations.some((i) => i.provider === provider && i.status === "active");

  const getLastSync = (provider: ProviderType) => {
    const integration = integrations.find((i) => i.provider === provider);
    if (!integration?.lastSyncAt) return null;
    return formatRelative(integration.lastSyncAt);
  };

  async function handleDisconnect(provider: ProviderType) {
    try {
      const response = await fetch(`/api/integrations/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      if (response.ok) {
        setIntegrations((prev) => prev.filter((i) => i.provider !== provider));
        setMessage({ type: "success", text: `${PROVIDER_CONFIG[provider].label} disconnected.` });
      } else {
        const data = await response.json();
        setMessage({ type: "error", text: data.error || "Failed to disconnect." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  const providers: ProviderType[] = ["google", "slack"];

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, fontSize: "2rem", color: "rgba(255,255,255,0.92)", margin: 0 }}>
          Integrations
        </h1>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem", letterSpacing: "0.05em", color: "rgba(255,255,255,0.35)", marginTop: "0.5rem" }}>
          Connect real-world data sources to verify Pattern-Breaker Contract completion.
        </p>
      </div>

      {/* Status message */}
      {message && (
        <div
          style={{
            padding: "0.75rem 1rem",
            marginBottom: "1.5rem",
            border: `1px solid ${message.type === "success" ? "rgba(110,231,183,0.25)" : "rgba(252,165,165,0.25)"}`,
            backgroundColor: message.type === "success" ? "rgba(110,231,183,0.06)" : "rgba(252,165,165,0.06)",
            color: message.type === "success" ? "rgba(110,231,183,0.90)" : "rgba(252,165,165,0.90)",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.75rem",
          }}
        >
          {message.text}
          <button
            onClick={() => setMessage(null)}
            style={{ float: "right", background: "none", border: "none", color: "inherit", cursor: "pointer", opacity: 0.6 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>
          Loading integrations...
        </p>
      )}

      {/* Provider list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {providers.map((provider) => {
          const connected = isConnected(provider);
          const config = PROVIDER_CONFIG[provider];
          const lastSync = getLastSync(provider);

          return (
            <div
              key={provider}
              style={{
                border: `1px solid ${connected ? "rgba(110,231,183,0.15)" : "rgba(255,255,255,0.07)"}`,
                backgroundColor: connected ? "rgba(110,231,183,0.02)" : "rgba(255,255,255,0.01)",
                padding: "1.25rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontSize: "1.5rem" }}>{config.icon}</span>
                  <div>
                    <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, fontSize: "1.1rem", color: "rgba(255,255,255,0.80)" }}>
                      {config.label}
                    </div>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem", color: "rgba(255,255,255,0.30)", marginTop: "0.25rem", maxWidth: "40ch" }}>
                      {config.description}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                  {connected && (
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", color: "rgba(110,231,183,0.60)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {lastSync ? `Synced ${lastSync}` : "Connected"}
                    </span>
                  )}
                  {connected ? (
                    <button
                      onClick={() => handleDisconnect(provider)}
                      style={{
                        padding: "0.5rem 1rem",
                        border: "1px solid rgba(252,165,165,0.2)",
                        backgroundColor: "transparent",
                        color: "rgba(252,165,165,0.7)",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "0.7rem",
                        cursor: "pointer",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(252,165,165,0.06)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => initiateOAuth(provider)}
                      style={{
                        padding: "0.5rem 1rem",
                        border: "1px solid rgba(255,255,255,0.12)",
                        backgroundColor: "rgba(255,255,255,0.03)",
                        color: "rgba(255,255,255,0.6)",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "0.7rem",
                        cursor: "pointer",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)"; }}
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info footer */}
      <div style={{ marginTop: "2rem", padding: "1rem", border: "1px solid rgba(255,255,255,0.05)", backgroundColor: "rgba(255,255,255,0.01)" }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", color: "rgba(255,255,255,0.25)", lineHeight: 1.6 }}>
          OAuth tokens are encrypted at rest using AES-256-GCM. We only request read-only scopes.
          Data is used exclusively for Pattern-Breaker Contract verification. You can disconnect at any time.
        </p>
      </div>
    </div>
  );
}
