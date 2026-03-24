"use client";

import React, { useState } from "react";
import { Linkedin, Mail, Link2, Check, Share2 } from "lucide-react";
import { motion } from "framer-motion";

interface ShortShareProps {
  url: string;
  title: string;
  className?: string;
}

const shareButtons = [
  {
    id: "linkedin",
    icon: Linkedin,
    label: "LinkedIn",
    getUrl: (url: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    id: "email",
    icon: Mail,
    label: "Email",
    getUrl: (url: string, title: string) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
  },
];

export default function ShortShare({ url, title, className = "" }: ShortShareProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-2 rounded-full border border-white/10 bg-black/25 p-2 backdrop-blur-md ${className}`}
    >
      <span className="px-2 text-[10px] font-mono uppercase tracking-[0.26em] text-white/35">
        Share
      </span>

      <motion.a
        whileTap={{ scale: 0.97 }}
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/55 transition-all hover:bg-white/[0.07] hover:text-white/85"
        aria-label="Share on LinkedIn"
      >
        <Linkedin className="h-4 w-4" />
        <span className="hidden sm:inline">LinkedIn</span>
      </motion.a>

      <motion.a
        whileTap={{ scale: 0.97 }}
        href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/55 transition-all hover:bg-white/[0.07] hover:text-white/85"
        aria-label="Share by email"
      >
        <Mail className="h-4 w-4" />
        <span className="hidden sm:inline">Email</span>
      </motion.a>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleCopyLink}
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs transition-all ${
          copied
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            : "border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/[0.07] hover:text-white/85"
        }`}
        aria-label="Copy link"
      >
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        <span className="hidden sm:inline">{copied ? "Copied" : "Copy link"}</span>
      </motion.button>
    </div>
  );
}

