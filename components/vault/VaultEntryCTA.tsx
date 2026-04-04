"use client";

import Link from "next/link";

export default function VaultEntryCTA() {
  return (
    <div className="text-center border-t border-white/[0.08] pt-16">
      <h2 className="text-4xl font-serif text-white">
        Access is not automatic
      </h2>

      <p className="mt-4 text-white/50 max-w-xl mx-auto">
        The Vault is designed for operators who require structured clarity,
        not casual consumption.
      </p>

      <Link
        href="/vault"
        className="mt-8 inline-block px-8 py-4 bg-amber-600 text-white text-xs uppercase tracking-wider hover:bg-amber-500"
      >
        Request Vault Access
      </Link>
    </div>
  );
}