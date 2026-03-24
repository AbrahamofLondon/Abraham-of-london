"use client";

import React, { useState } from "react";
import { Heart, Bookmark, Share2, MessageCircle, Check } from "lucide-react";
import { motion } from "framer-motion";

interface ShortActionsProps {
  shortId: string;
  likes?: number;
  isLiked?: boolean;
  saves?: number;
  isSaved?: boolean;
  shares?: number;
  onLike?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  className?: string;
}

function ActionPill({
  children,
  onClick,
  active = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs transition-all ${
        active
          ? "border-amber-500/30 bg-amber-500/10 text-white"
          : "border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/[0.07] hover:text-white/80"
      }`}
    >
      {children}
    </motion.button>
  );
}

export default function ShortActions({
  shortId,
  likes = 0,
  isLiked = false,
  saves = 0,
  isSaved = false,
  shares = 0,
  onLike,
  onSave,
  onShare,
  className = "",
}: ShortActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (onShare) {
      onShare();
      return;
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("Failed to copy link", error);
    }
  };

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-2 rounded-full border border-white/10 bg-black/25 p-2 backdrop-blur-md ${className}`}
      data-short-id={shortId}
    >
      <ActionPill onClick={onLike} active={isLiked}>
        <Heart className={`h-4 w-4 ${isLiked ? "fill-rose-500 text-rose-500" : "text-current"}`} />
        <span className="font-mono">{likes}</span>
      </ActionPill>

      <ActionPill onClick={onSave} active={isSaved}>
        <Bookmark
          className={`h-4 w-4 ${isSaved ? "fill-amber-500 text-amber-500" : "text-current"}`}
        />
        <span className="font-mono">{saves}</span>
      </ActionPill>

      <ActionPill onClick={handleShare} active={copied}>
        {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
        <span className="font-mono">{copied ? "Copied" : shares}</span>
      </ActionPill>

      <motion.a
        whileTap={{ scale: 0.97 }}
        href="#comments"
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs text-white/55 transition-all hover:bg-white/[0.07] hover:text-white/80"
      >
        <MessageCircle className="h-4 w-4" />
      </motion.a>
    </div>
  );
}