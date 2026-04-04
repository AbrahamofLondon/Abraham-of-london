/* components/diagnostics/report/ReportShell.tsx */
import * as React from "react";

export default function ReportShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
        {children}
      </div>
    </div>
  );
}