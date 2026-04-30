"use client";

type ProgressStep = "context" | "signal" | "result";

type Props = {
  current: ProgressStep;
};

const STEPS: Array<{ id: ProgressStep; label: string; description: string }> = [
  { id: "context", label: "Step 1", description: "Context" },
  { id: "signal", label: "Step 2", description: "Signal" },
  { id: "result", label: "Step 3", description: "Resolution" },
];

export default function ProgressIndicator({ current }: Props) {
  const activeIndex = STEPS.findIndex((step) => step.id === current);

  return (
    <div className="rounded-[28px] border border-neutral-200 bg-white/90 p-5 shadow-sm backdrop-blur">
      <div className="flex items-center gap-3">
        {STEPS.map((step, index) => {
          const complete = index < activeIndex;
          const active = index === activeIndex;

          return (
            <div key={step.id} className="flex min-w-0 flex-1 items-center gap-3">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.24em] text-neutral-500">
                  {step.label}
                </div>
                <div
                  className={`mt-1 text-sm transition-all duration-500 ${
                    active ? "font-semibold text-neutral-950" : "text-neutral-500"
                  }`}
                >
                  {step.description}
                </div>
              </div>

              <div
                className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                  complete
                    ? "bg-neutral-900"
                    : active
                      ? "bg-gradient-to-r from-[#8a6a2f] to-neutral-900"
                      : "bg-neutral-200"
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
