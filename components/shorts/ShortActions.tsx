"use client";

import React, { useState } from "react";
import { Link2, Check } from "lucide-react";
import { motion } from "framer-motion";

interface ShortActionsProps {
  shortId: string;
  className?: string;
}

export default function ShortActions({
  shortId,
  className = "",
}: ShortActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-2 rounded-full border border-white/10 bg-black/25 p-2 backdrop-blur-md ${className}`}
      data-short-id={shortId}
    >
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleCopyLink}
        className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs transition-all ${
          copied
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            : "border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/[0.07] hover:text-white/80"
        }`}
      >
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        <span className="font-mono">{copied ? "Copied" : "Copy link"}</span>
      </motion.button>
    </div>
  );
}