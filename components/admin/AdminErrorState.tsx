import * as React from "react";
import { AlertTriangle } from "lucide-react";

type AdminErrorStateProps = {
  title: string;
  message: string;
  action?: string;
};

export default function AdminErrorState({
  title,
  message,
  action,
}: AdminErrorStateProps) {
  return (
    <div className="border border-amber-500/20 bg-amber-500/5 p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-full border border-amber-500/20 bg-amber-500/10 p-2">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h1 className="font-serif text-2xl text-white">{title}</h1>
          <p className="mt-2 text-sm leading-7 text-white/60">{message}</p>
          {action ? (
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-400/80">
              {action}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
