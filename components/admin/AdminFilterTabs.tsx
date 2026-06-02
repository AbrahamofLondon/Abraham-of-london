/**
 * components/admin/AdminFilterTabs.tsx
 *
 * Generic filter tab bar for admin queues.
 * Supports attention-highlighted tabs (amber) and count badges.
 */

import * as React from "react";

export type AdminFilterTab<T extends string> = {
  key: T;
  label: string;
  count: number;
  attention?: boolean;  // highlight amber when count > 0
};

export type AdminFilterTabsProps<T extends string> = {
  tabs: AdminFilterTab<T>[];
  active: T;
  onChange: (tab: T) => void;
};

export function AdminFilterTabs<T extends string>({
  tabs,
  active,
  onChange,
}: AdminFilterTabsProps<T>) {
  return (
    <div className="flex flex-wrap gap-1" role="tablist">
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        const isAttention = tab.attention && tab.count > 0;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={`px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider border transition-colors ${
              isActive
                ? "border-sky-400/40 bg-sky-400/10 text-sky-200"
                : isAttention
                ? "border-amber-400/30 text-amber-200/70 hover:text-amber-100"
                : "border-white/10 text-white/45 hover:text-white/70 hover:border-white/20"
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 ${isActive ? "opacity-80" : "opacity-50"}`}>
              ({tab.count})
            </span>
          </button>
        );
      })}
    </div>
  );
}
