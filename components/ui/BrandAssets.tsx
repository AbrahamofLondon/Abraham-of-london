// components/ui/BrandAssets.tsx
import * as React from "react";
import Button from "@/components/ui/Button";

type ClassName = string | undefined;

export function InterfaceCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: ClassName;
}) {
  return <div className={["city-gate-card", className].filter(Boolean).join(" ")}>{children}</div>;
}

export function MetadataTag({
  children,
  icon: Icon,
  className,
}: {
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: ClassName;
}) {
  return (
    <div
      className={[
        "inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em]",
        "text-amber-500/60 border border-amber-500/20 px-4 py-1.5 rounded-full",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {Icon ? <Icon className="h-3 w-3" /> : null}
      {children}
    </div>
  );
}

/**
 * LEGACY COMPAT: ProtocolButton now delegates to canonical Button.
 */
export type ProtocolButtonProps = React.ComponentProps<typeof Button>;

export function ProtocolButton({ children, ...props }: ProtocolButtonProps) {
  return <Button {...props}>{children}</Button>;
}