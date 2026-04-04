"use client";

import * as React from "react";
import Link from "next/link";

export default function SeriousBuyerGate() {
  return (
    <section className="border border-amber-500/30 bg-amber-500/[0.03] p-10 text-center">
      <h2 className="font-serif text-4xl text-white">
        This is not for casual exploration
      </h2>

      <p className="mt-4 text-white/50 max-w-2xl mx-auto">
        If the matter you are dealing with has no real consequence, this system
        is unnecessary. If it does, delay increases cost.
      </p>

      <div className="mt-10 flex justify-center gap-4 flex-wrap">
        <Link
          href="/diagnostics"
          className="px-6 py-3 border border-white/[0.1] text-white text-xs uppercase tracking-wider hover:bg-white/[0.05]"
        >
          Start diagnostics
        </Link>

        <Link
          href="/consulting/strategy-room"
          className="px-6 py-3 bg-amber-600 text-white text-xs uppercase tracking-wider hover:bg-amber-500"
        >
          Enter Strategy Room
        </Link>
      </div>
    </section>
  );
}