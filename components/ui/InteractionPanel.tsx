/* components/ui/InteractionPanel.tsx */
"use client";

import * as React from "react";
import { Heart, Bookmark, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { withRateLimit } from "@/lib/rate-limit"; // ✅ client-safe barrel

type InteractionAction = "like" | "save";

interface InteractionPanelProps {
  slug: string;
  initialLikes?: number;
  initialSaves?: number;
  isLiked?: boolean;
  isSaved?: boolean;
}

/**
 * Institutional Interaction Panel
 * - Client-safe (no server imports)
 * - UX-only throttling (local)
 * - Optimistic UI with rollback
 * - Clean telemetry-style messaging
 */
export default function InteractionPanel({
  slug,
  initialLikes = 0,
  initialSaves = 0,
  isLiked: initialIsLiked = false,
  isSaved: initialIsSaved = false,
}: InteractionPanelProps) {
  const { data: session } = useSession();

  const [state, setState] = React.useState(() => ({
    liked: Boolean(initialIsLiked),
    saved: Boolean(initialIsSaved),
    likesCount: Math.max(0, Number(initialLikes) || 0),
    savesCount: Math.max(0, Number(initialSaves) || 0),
  }));

  const [loading, setLoading] = React.useState<InteractionAction | null>(null);

  const safeSlug = React.useMemo(() => String(slug || "").trim(), [slug]);

  const requireAuth = React.useCallback((): boolean => {
    if (!session?.user) {
      toast.error("Access Restricted", {
        description: "Sign in to interact with the Vault.",
      });
      return false;
    }
    return true;
  }, [session?.user]);

  function computeNext(prev: typeof state, action: InteractionAction) {
    const isLike = action === "like";
    const currentOn = isLike ? prev.liked : prev.saved;
    const nextOn = !currentOn;

    const countKey = isLike ? "likesCount" : "savesCount";
    const nextCount = nextOn ? prev[countKey] + 1 : Math.max(0, prev[countKey] - 1);

    return {
      ...prev,
      ...(isLike ? { liked: nextOn } : { saved: nextOn }),
      [countKey]: nextCount,
    };
  }

  const handleInteraction = React.useCallback(
    async (action: InteractionAction) => {
      if (!safeSlug) return;
      if (!requireAuth()) return;
      if (loading) return;

      // ✅ UX-only throttle (prevents spam clicks, not “security”)
      const rl = await withRateLimit({
        key: `interaction:${action}:${safeSlug}`,
        limit: 8,
        windowMs: 10_000,
        persist: true,
      });

      if (!rl.ok) {
        // Safely handle resetAt being undefined
        let seconds = 8; // default fallback
        if (rl.resetAt) {
          seconds = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000));
        }
        
        toast.warning("Throttle Active", {
          description: `Slow down — try again in ${seconds}s.`,
        });
        return;
      }

      setLoading(action);

      // --- optimistic update with rollback ---------------------------------
      let snapshot: typeof state | null = null;
      setState((prev) => {
        snapshot = prev;
        return computeNext(prev, action);
      });

      try {
        const response = await fetch("/api/interactions/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: safeSlug, action }),
        });

        if (!response.ok) {
          throw new Error(`SYNC_FAILED_${response.status}`);
        }

        const data: any = await response.json();

        // server returns: { status: "added" | "removed" } (as you had before)
        const serverAdded = data?.status === "added";

        // reconcile server truth in case it disagrees with optimistic
        setState((prev) => {
          const isLike = action === "like";
          const flagKey = isLike ? "liked" : "saved";
          const countKey = isLike ? "likesCount" : "savesCount";

          const currentlyOn = prev[flagKey];
          if (currentlyOn === serverAdded) return prev;

          // adjust count to match server truth
          const nextCount = serverAdded ? prev[countKey] + 1 : Math.max(0, prev[countKey] - 1);

          return {
            ...prev,
            [flagKey]: serverAdded,
            [countKey]: nextCount,
          };
        });

        toast.success(serverAdded ? "Asset Synchronized" : "Reference Removed");
      } catch (err) {
        // rollback
        if (snapshot) setState(snapshot);
        toast.error("Vault Sync Error", {
          description: "Unable to write interaction. Try again shortly.",
        });
      } finally {
        setLoading(null);
      }
    },
    [safeSlug, requireAuth, loading]
  );

  const handleShare = React.useCallback(async () => {
    try {
      const url = window.location.href;

      // Prefer native share where available
      if (navigator.share) {
        await navigator.share({ title: document.title, url });
        toast.success("Shared");
        return;
      }

      await navigator.clipboard.writeText(url);
      toast.info("Link Copied");
    } catch {
      toast.error("Share Failed");
    }
  }, []);

  return (
    <div className="flex items-center gap-6 border-y border-white/5 py-4 my-8 font-mono">
      {/* LIKE */}
      <button
        onClick={() => handleInteraction("like")}
        disabled={!!loading}
        className="group flex items-center gap-2 transition-all"
        aria-label="Like this asset"
      >
        <div
          className={cn(
            "p-2 rounded-lg transition-colors",
            state.liked ? "bg-red-500/10 text-red-500" : "bg-white/5 text-zinc-500"
          )}
        >
          {loading === "like" ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Heart size={18} fill={state.liked ? "currentColor" : "none"} />
          )}
        </div>
        <span className="text-xs text-zinc-500">{state.likesCount}</span>
      </button>

      {/* SAVE */}
      <button
        onClick={() => handleInteraction("save")}
        disabled={!!loading}
        className="group flex items-center gap-2 transition-all"
        aria-label="Save this asset"
      >
        <div
          className={cn(
            "p-2 rounded-lg transition-colors",
            state.saved ? "bg-amber-500/10 text-amber-500" : "bg-white/5 text-zinc-500"
          )}
        >
          {loading === "save" ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Bookmark size={18} fill={state.saved ? "currentColor" : "none"} />
          )}
        </div>
        <span className="text-xs text-zinc-500">{state.savesCount}</span>
      </button>

      {/* SHARE */}
      <button
        onClick={handleShare}
        className="ml-auto p-2 bg-white/5 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors"
        aria-label="Share this page"
      >
        <Share2 size={18} />
      </button>
    </div>
  );
}