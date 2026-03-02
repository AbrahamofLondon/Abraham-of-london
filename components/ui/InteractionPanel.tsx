/* components/ui/InteractionPanel.tsx */
"use client";

import { useState } from "react";
import { Heart, Bookmark, Share2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router"; // Changed from 'next/navigation'

interface InteractionPanelProps {
  slug: string;
  initialLikes: number;
  initialSaves: number;
  isLiked: boolean;
  isSaved: boolean;
}

export default function InteractionPanel({ 
  slug, 
  initialLikes, 
  initialSaves, 
  isLiked: initialIsLiked, 
  isSaved: initialIsSaved 
}: InteractionPanelProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [likes, setLikes] = useState(initialLikes);
  const [saves, setSaves] = useState(initialSaves);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleLike = async () => {
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    setIsLiking(true);
    try {
      const res = await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, type: "like" }),
      });

      if (res.ok) {
        setIsLiked(!isLiked);
        setLikes(prev => isLiked ? prev - 1 : prev + 1);
        router.reload(); // refresh() doesn't exist in pages router, use reload() or router.replace(router.asPath)
      }
    } catch (error) {
      console.error("Failed to like:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleSave = async () => {
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, type: "save" }),
      });

      if (res.ok) {
        setIsSaved(!isSaved);
        setSaves(prev => isSaved ? prev - 1 : prev + 1);
        router.reload(); // refresh() doesn't exist in pages router
      }
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: document.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // You might want to add a toast notification here
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
      {/* Like Button */}
      <button
        onClick={handleLike}
        disabled={isLiking}
        className={`
          group relative flex items-center justify-center w-12 h-12 rounded-full
          border border-zinc-800 bg-black/80 backdrop-blur-sm
          hover:border-amber-900/50 transition-all duration-300
          ${isLiked ? 'text-amber-500' : 'text-zinc-500 hover:text-amber-400'}
        `}
        aria-label="Like this brief"
      >
        <Heart className={`h-5 w-5 ${isLiked ? 'fill-amber-500' : ''}`} />
        {likes > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[1.5rem] h-5 px-1.5 
                         bg-amber-900/90 text-amber-200 text-[10px] font-mono 
                         rounded-full flex items-center justify-center
                         border border-amber-700/50">
            {likes}
          </span>
        )}
      </button>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className={`
          group relative flex items-center justify-center w-12 h-12 rounded-full
          border border-zinc-800 bg-black/80 backdrop-blur-sm
          hover:border-amber-900/50 transition-all duration-300
          ${isSaved ? 'text-amber-500' : 'text-zinc-500 hover:text-amber-400'}
        `}
        aria-label="Save this brief"
      >
        <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-amber-500' : ''}`} />
        {saves > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[1.5rem] h-5 px-1.5 
                         bg-amber-900/90 text-amber-200 text-[10px] font-mono 
                         rounded-full flex items-center justify-center
                         border border-amber-700/50">
            {saves}
          </span>
        )}
      </button>

      {/* Share Button */}
      <button
        onClick={handleShare}
        className="flex items-center justify-center w-12 h-12 rounded-full
                 border border-zinc-800 bg-black/80 backdrop-blur-sm
                 text-zinc-500 hover:text-amber-400 hover:border-amber-900/50
                 transition-all duration-300"
        aria-label="Share this brief"
      >
        <Share2 className="h-5 w-5" />
      </button>

      {/* Authentication Status Indicator */}
      {!session && (
        <div className="absolute -left-48 top-1/2 -translate-y-1/2 
                      text-[8px] font-mono text-zinc-700 whitespace-nowrap
                      border border-zinc-800 bg-black/60 backdrop-blur-sm
                      px-3 py-1.5 rounded-full">
          sign in to engage →
        </div>
      )}
    </div>
  );
}