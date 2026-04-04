"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function AuthorityBlock({
  title,
  excerpt,
  href,
}: {
  title: string;
  excerpt: string;
  href: string;
}) {
  return (
    <div className="border border-white/[0.08] bg-white/[0.02] p-8">
      <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-amber-400/60">
        Canon Insight
      </div>

      <h3 className="mt-4 font-serif text-2xl text-white">
        {title}
      </h3>

      <p className="mt-3 text-sm text-white/50 leading-relaxed">
        {excerpt}
      </p>

      <Link
        href={href}
        className="mt-6 inline-flex items-center gap-2 text-amber-400 text-[10px] uppercase tracking-wider"
      >
        Read full essay <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}