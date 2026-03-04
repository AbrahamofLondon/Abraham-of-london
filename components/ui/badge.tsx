import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1 whitespace-nowrap",
    "rounded-full border px-2.5 py-0.5",
    "text-[11px] font-semibold uppercase tracking-wide",
    "transition-colors",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "select-none",
  ].join(" "),
  {
    variants: {
      variant: {
        // --- shadcn-compatible defaults ---
        default:
          "border-transparent bg-zinc-900 text-zinc-50 hover:bg-zinc-800 focus-visible:ring-zinc-900/30 focus-visible:ring-offset-white",
        secondary:
          "border-transparent bg-zinc-100 text-zinc-900 hover:bg-zinc-200 focus-visible:ring-zinc-400/30 focus-visible:ring-offset-white",
        destructive:
          "border-transparent bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600/30 focus-visible:ring-offset-white",
        outline:
          "border-zinc-200 bg-transparent text-zinc-900 hover:bg-zinc-50 focus-visible:ring-zinc-400/30 focus-visible:ring-offset-white",

        // --- Abraham of London / Vault-grade variants ---
        gold:
          "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/15 focus-visible:ring-amber-500/30 focus-visible:ring-offset-black",
        ink:
          "border-white/10 bg-black/60 text-zinc-200 hover:bg-black/70 focus-visible:ring-white/10 focus-visible:ring-offset-black",
        muted:
          "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 focus-visible:ring-white/10 focus-visible:ring-offset-black",
        success:
          "border-emerald-500/25 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15 focus-visible:ring-emerald-500/25 focus-visible:ring-offset-black",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-2.5 py-0.5 text-[11px]",
        lg: "px-3 py-1 text-[12px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Render as a different element if needed (rare).
   * Defaults to "span".
   */
  asChild?: boolean;
}

/**
 * Badge — institutional tag component.
 * - Defaults to <span>
 * - forwardRef for component libraries + tooltips/popovers
 */
const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };