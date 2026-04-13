"use client";

import * as React from "react";
import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";
import AccessGate from "@/components/AccessGate";
import { decodeBodyCodePayload } from "@/lib/content/client-codec";
import type { AccessTier } from "@/lib/access/tier-policy";

type ClientUnlockRendererProps = {
  initialCode: string | null;
  slug: string;
  requiredTier: string;
  endpoint?: string;
  title?: string;
  message?: string;
  onGoToJoin?: () => void;
};

function safeString(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function normalizeSlug(input: unknown): string {
  return safeString(input)
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

function buildDefaultEndpoint(slug: string): string {
  const s = normalizeSlug(slug);
  if (!s) return "/api/content";

  const [head = "", ...rest] = s.split("/");
  const tail = rest.join("/");

  switch (head.toLowerCase()) {
    case "canon":
      return `/api/canon/${encodeURIComponent(tail)}`;

    case "books":
      return `/api/books/${encodeURIComponent(tail)}`;

    case "blog":
    case "posts":
      return `/api/blog/${encodeURIComponent(tail)}`;

    case "briefs":
      return `/api/briefs/${encodeURIComponent(tail.split("/").pop() || tail)}`;

    case "vault":
      return `/api/vault/${tail.split("/").map(encodeURIComponent).join("/")}`;

    case "downloads":
      return `/api/downloads/${tail.split("/").map(encodeURIComponent).join("/")}`;

    case "resources":
      return `/api/resources/${tail.split("/").map(encodeURIComponent).join("/")}`;

    case "frameworks":
      return `/api/frameworks/${tail.split("/").map(encodeURIComponent).join("/")}`;

    case "events":
      return `/api/events/${encodeURIComponent(tail)}`;

    case "content":
      return `/api/content/${tail.split("/").map(encodeURIComponent).join("/")}`;

    default:
      return `/api/content/${s.split("/").map(encodeURIComponent).join("/")}`;
  }
}

export default function ClientUnlockRenderer({
  initialCode,
  slug,
  requiredTier,
  endpoint,
  title,
  message = "Restricted content",
  onGoToJoin,
}: ClientUnlockRendererProps) {
  const [code, setCode] = React.useState<string | null>(initialCode);
  const [loading, setLoading] = React.useState(false);
  const [unlockError, setUnlockError] = React.useState<string | null>(null);

  const resolvedEndpoint = React.useMemo(() => {
    return safeString(endpoint) || buildDefaultEndpoint(slug);
  }, [endpoint, slug]);

  const unlock = React.useCallback(async () => {
    setLoading(true);
    setUnlockError(null);

    try {
      const res = await fetch(resolvedEndpoint, {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        setUnlockError(safeString(json?.reason) || "UNLOCK_FAILED");
        return;
      }

      const decoded = decodeBodyCodePayload(json);
      if (!decoded.trim()) {
        setUnlockError("UNLOCK_PAYLOAD_MISSING");
        return;
      }

      setCode(decoded);
    } catch {
      setUnlockError("UNLOCK_NETWORK_FAILURE");
    } finally {
      setLoading(false);
    }
  }, [resolvedEndpoint]);

  if (!code) {
    return (
      <div>
        <AccessGate
          title={title ?? ""}
          requiredTier={requiredTier as AccessTier}
          onUnlocked={unlock}
          message={message}
          onGoToJoin={onGoToJoin}
        />
        {unlockError ? (
          <div className="mt-6 text-center font-mono text-[10px] uppercase tracking-widest text-red-400/90">
            {unlockError}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={loading ? "pointer-events-none opacity-60" : ""}>
      <SafeMDXRenderer code={code} />
    </div>
  );
}