"use client";

import * as React from "react";

export default function ReportPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="text-[10px] font-mono uppercase tracking-widest px-4 py-2 border border-neutral-200 hover:border-neutral-900 transition-all bg-white"
    >
      Download Protocol (PDF)
    </button>
  );
}