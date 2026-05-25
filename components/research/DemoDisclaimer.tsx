"use client";

/**
 * DemoDisclaimer — Law 2 of the Honesty Constitution.
 * Must be rendered prominently by every DEMO module.
 * Cannot be hidden in a tooltip or collapsed section.
 */
export function DemoDisclaimer({ moduleName }: { moduleName?: string }) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex items-start gap-3 rounded-lg border border-purple-500/30 bg-purple-500/8 px-4 py-3"
      data-testid="demo-disclaimer"
    >
      <span className="mt-0.5 shrink-0 rounded bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-widest text-purple-400">
        DEMO
      </span>
      <p className="text-xs text-purple-300/80">
        <span className="font-semibold text-purple-300">Illustrative only. Not production logic.</span>
        {moduleName ? ` ${moduleName} runs simulated output for demonstration purposes.` : " This module runs simulated output for demonstration purposes."}
        {" "}Findings from this module do not reflect real system state.
      </p>
    </div>
  );
}
