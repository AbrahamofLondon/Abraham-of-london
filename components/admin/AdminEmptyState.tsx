/**
 * components/admin/AdminEmptyState.tsx
 *
 * Standardised empty-state component for admin queues and tables.
 */

import * as React from "react";

export type AdminEmptyStateProps = {
  message: string;
  detail?: string;
  action?: React.ReactNode;
};

export function AdminEmptyState({ message, detail, action }: AdminEmptyStateProps) {
  return (
    <div className="border border-white/8 bg-black/15 px-6 py-10 text-center">
      <div className="mx-auto h-8 w-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center mb-3">
        <span className="text-white/25 text-lg">–</span>
      </div>
      <p className="text-sm text-white/50">{message}</p>
      {detail && <p className="mt-1 text-xs text-white/30">{detail}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
