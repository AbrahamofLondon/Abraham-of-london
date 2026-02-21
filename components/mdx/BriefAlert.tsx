import * as React from "react";
import { ShieldAlert, Info, AlertTriangle, AlertCircle } from "lucide-react";

type Props = {
  title?: string;
  level?: "info" | "warn" | "danger" | "success";
  children?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
};

export default function BriefAlert({
  title = "Brief Alert",
  level = "info",
  children,
  className = "",
  icon,
}: Props) {
  const styles = {
    info: {
      container: "border-blue-500/25 bg-blue-500/10 text-blue-200",
      icon: <Info className="h-4 w-4" />,
    },
    warn: {
      container: "border-amber-500/25 bg-amber-500/10 text-amber-200",
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    danger: {
      container: "border-rose-500/25 bg-rose-500/10 text-rose-200",
      icon: <AlertCircle className="h-4 w-4" />,
    },
    success: {
      container: "border-emerald-500/25 bg-emerald-500/10 text-emerald-200",
      icon: <ShieldAlert className="h-4 w-4" />,
    },
  };

  const selected = styles[level] || styles.info;

  return (
    <div className={`rounded-2xl border p-5 ${selected.container} ${className}`}>
      <div className="flex items-center gap-3">
        {icon || selected.icon}
        <div className="text-[11px] font-mono font-bold uppercase tracking-[0.25em]">
          {title}
        </div>
      </div>
      {children ? <div className="mt-3 text-sm text-white/80 prose prose-invert max-w-none">{children}</div> : null}
    </div>
  );
}