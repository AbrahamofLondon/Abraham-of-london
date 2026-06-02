/**
 * components/admin/AdminSearchInput.tsx
 *
 * Standardised search input for admin queues.
 */

import * as React from "react";

export type AdminSearchInputProps = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
};

export function AdminSearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className = "",
}: AdminSearchInputProps) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-white/85 placeholder-white/25 focus:border-sky-400/30 focus:outline-none transition-colors ${className}`}
    />
  );
}
