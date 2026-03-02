"use client";

import * as React from "react";
import { Heart, Bookmark, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

interface InteractionPanelProps {
  slug: string;
  initialLikes?: number;
  initialSaves?: number;
  isLiked?: boolean;
  isSaved?: boolean;
}

export default function InteractionPanel({
  slug,
  initialLikes = 0,
  initialSaves = 0,
  isLiked: initialIsLiked = false,
  isSaved: initialIsSaved = false,
}: InteractionPanelProps) {
  const { data: session } = useSession();
  const [state, setState] = React.useState({
    liked: initialIsLiked,
    saved: initialIsSaved,
    likesCount: initialLikes,
    savesCount: initialSaves,
  });
  const [loading, setLoading] = React.useState<"like" | "save" | null>(null);

  const handleInteraction = async (action: "like" | "save") => {
    if (!session?.user) {
      toast.error("Access Restricted", {
        description: "Join the Inner Circle to interact with the vault.",
      });
      return;
    }

    setLoading(action);

    try {
      const response = await fetch("/api/interactions/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, action }),
      });

      if (!response.ok) throw new Error("Sync Failed");

      const data = await response.json();
      const isAdded = data.status === "added";

      setState((prev) => ({
        ...prev,
        [action === "like" ? "liked" : "saved"]: isAdded,
        [action === "like" ? "likesCount" : "savesCount"]: isAdded
          ? prev[action === "like" ? "likesCount" : "savesCount"] + 1
          : Math.max(0, prev[action === "like" ? "likesCount" : "savesCount"] - 1),
      }));

      toast.success(isAdded ? "Asset Synchronized" : "Reference Removed");
    } catch (error) {
      toast.error("Vault Sync Error");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex items-center gap-6 border-y border-white/5 py-4 my-8 font-mono">
      <button
        onClick={() => handleInteraction("like")}
        disabled={!!loading}
        className="group flex items-center gap-2 transition-all"
      >
        <div className={cn(
          "p-2 rounded-lg transition-colors",
          state.liked ? "bg-red-500/10 text-red-500" : "bg-white/5 text-zinc-500"
        )}>
          {loading === "like" ? <Loader2 size={18} className="animate-spin" /> : <Heart size={18} fill={state.liked ? "currentColor" : "none"} />}
        </div>
        <span className="text-xs text-zinc-500">{state.likesCount}</span>
      </button>

      <button
        onClick={() => handleInteraction("save")}
        disabled={!!loading}
        className="group flex items-center gap-2 transition-all"
      >
        <div className={cn(
          "p-2 rounded-lg transition-colors",
          state.saved ? "bg-amber-500/10 text-amber-500" : "bg-white/5 text-zinc-500"
        )}>
          {loading === "save" ? <Loader2 size={18} className="animate-spin" /> : <Bookmark size={18} fill={state.saved ? "currentColor" : "none"} />}
        </div>
        <span className="text-xs text-zinc-500">{state.savesCount}</span>
      </button>

      <button 
        onClick={() => {
          navigator.clipboard.writeText(window.location.href);
          toast.info("Link Copied");
        }}
        className="ml-auto p-2 bg-white/5 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <Share2 size={18} />
      </button>
    </div>
  );
}