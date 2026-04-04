"use client";

import * as React from "react";

export default function VaultAccessGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hasAccess, setHasAccess] = React.useState(false);

  if (hasAccess) return <>{children}</>;

  return (
    <div className="border border-amber-500/30 bg-amber-500/[0.03] p-10 text-center">
      <h2 className="text-white font-serif text-3xl">
        Restricted Vault Access
      </h2>

      <p className="mt-4 text-white/50 max-w-xl mx-auto">
        This material is reserved for operators working at a level where
        clarity has real consequence.
      </p>

      <button
        onClick={() => setHasAccess(true)}
        className="mt-8 px-6 py-3 bg-amber-600 text-white text-xs uppercase tracking-wider hover:bg-amber-500"
      >
        Request Access
      </button>
    </div>
  );
}