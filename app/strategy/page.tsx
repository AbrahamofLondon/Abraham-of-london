// app/strategy/page.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";

export default function StrategyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <motion.h1
        className="text-4xl font-semibold tracking-tight"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Strategy
      </motion.h1>

      <p className="mt-6 text-lg opacity-80 leading-relaxed">
        This page uses the <strong>App Router</strong> exclusively. <br />
        Any old <code>/pages</code> routes have been removed.
      </p>
    </main>
  );
}