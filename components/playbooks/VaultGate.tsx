"use client";

import * as React from "react";

export default function VaultGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [access, setAccess] = React.useState(false);

  return access ? (
    <>{children}</>
  ) : (
    <div className="border border-amber-500/30 bg-amber-500/[0.03] p-8 text-center">
      <h3 className="text-white font-serif text-2xl">
        Restricted Access
      </h3>

      <p className="mt-3 text-white/50">
        This material is reserved for serious operators.  
        Request access to unlock.
      </p>

      <button
        onClick={() => setAccess(true)}
        className="mt-6 px-6 py-3 bg-amber-600 text-white text-xs uppercase tracking-wider"
      >
        Request Access
      </button>
    </div>
  );
}