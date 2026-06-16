"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import ClientOnlyMDXRenderer from "@/components/mdx/ClientOnlyMDXRenderer";
import AccessGate from "@/components/AccessGate";
import { decodeBodyCodePayload } from "@/lib/content/client-codec";
import { normalizeUserTier, hasAccess, type AccessTier } from "@/lib/access/public";

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
  const { data: session } = useSession();
  const [code, setCode] = React.useState<string | null>(initialCode);
  const [loading, setLoading] = React.useState(false);
  const [unlockError, setUnlockError] = React.useState<string | null>(null);

  // Guards the one-shot auto-unlock below so a failed fetch cannot re-fire.
  const autoUnlockAttempted = React.useRef(false);

  const resolvedEndpoint = React.useMemo(() => {
    return safeString(endpoint) || buildDefaultEndpoint(slug);
  }, [endpoint, slug]);

  // Resolve the viewer's clearance the same way the gate (and the blog page) do,
  // so a pre-authorized reader can be fetched automatically rather than being
  // stranded behind a gate they could already pass.
  const userTier = normalizeUserTier(
    (session?.user as any)?.tier ?? (session?.user as any)?.role ?? "public",
  );
  const canRead = hasAccess(userTier, requiredTier as AccessTier);

  // `silent` auto-attempts suppress error chrome so an unauthorized viewer still
  // sees the gate (not a red error), while an explicit unlock click surfaces them.
  const unlock = React.useCallback(
    async (silent = false) => {
      setLoading(true);
      if (!silent) setUnlockError(null);

      try {
        const res = await fetch(resolvedEndpoint, {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json?.ok) {
          if (!silent) setUnlockError(safeString(json?.reason) || "UNLOCK_FAILED");
          return;
        }

        const decoded = decodeBodyCodePayload(json);
        if (!decoded.trim()) {
          if (!silent) setUnlockError("UNLOCK_PAYLOAD_MISSING");
          return;
        }

        setCode(decoded);
      } catch {
        if (!silent) setUnlockError("UNLOCK_NETWORK_FAILURE");
      } finally {
        setLoading(false);
      }
    },
    [resolvedEndpoint],
  );

  // Hydration-lifecycle bridge for pre-authorized readers: gated pages ship
  // initialCode=null, so without this the payload is never fetched and the gate
  // renders instead of the content the viewer is entitled to. Fire exactly once.
  React.useEffect(() => {
    if (!code && session?.user && canRead && !autoUnlockAttempted.current) {
      autoUnlockAttempted.current = true;
      void unlock(true);
    }
  }, [code, session?.user, canRead, unlock]);

  if (!code) {
    // While the silent auto-unlock is in flight for an entitled reader, show a
    // quiet loading state rather than flashing the gate.
    if (loading) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="animate-pulse font-mono text-[10px] uppercase tracking-widest text-amber-500/80">
            Loading content…
          </div>
        </div>
      );
    }

    return (
      <div>
        <AccessGate
          title={title ?? ""}
          requiredTier={requiredTier as AccessTier}
          userTier={userTier}
          isAuthenticated={!!session?.user}
          onUnlocked={() => {
            void unlock();
          }}
          message={message}
          onGoToAccess={onGoToJoin}
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
      <ClientOnlyMDXRenderer code={code} />
    </div>
  );
}