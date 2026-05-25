"use client";

export function HumanReviewFlag({ reason }: { reason?: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/8 px-4 py-3"
      data-testid="human-review-flag"
    >
      <span className="mt-0.5 shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-widest text-amber-400">
        HUMAN REVIEW
      </span>
      <p className="text-xs text-amber-300/80">
        <span className="font-semibold text-amber-300">Human review required.</span>
        {reason
          ? ` ${reason}`
          : " This output cannot be automatically validated. A qualified reviewer must assess before any action is taken."}
      </p>
    </div>
  );
}
