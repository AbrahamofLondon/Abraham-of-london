"use client";

import * as React from "react";
import AdminErrorState from "@/components/admin/AdminErrorState";

export default function AdminError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-black px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <AdminErrorState
          title="Administrative system interruption"
          message={error.message || "Unknown error occurred."}
          action="Retry the surface. If the failure persists, inspect the upstream service or database dependency."
        />
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 border border-white/10 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70 transition hover:border-white/20 hover:text-white"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
