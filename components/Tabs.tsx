// components/Tabs.tsx
import * as React from "react";

export type TabProps = {
  label: string;
  children: React.ReactNode;
};

export function Tab(_props: TabProps) {
  return null;
}

export type TabsProps = {
  children: React.ReactNode;
  className?: string;
  defaultIndex?: number;
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Tabs({
  children,
  className,
  defaultIndex = 0,
}: TabsProps) {
  const tabs = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<TabProps>[];

  const safeDefaultIndex =
    defaultIndex >= 0 && defaultIndex < tabs.length ? defaultIndex : 0;

  const [activeIndex, setActiveIndex] = React.useState(safeDefaultIndex);

  if (!tabs.length) return null;

  return (
    <div className={cn("my-10", className)}>
      <div className="overflow-hidden rounded-[1.75rem] border border-stone-200/80 bg-white/85 shadow-[0_20px_60px_-35px_rgba(0,0,0,0.18)] dark:border-white/10 dark:bg-white/[0.04]">
        <div className="border-b border-stone-200/80 px-3 py-3 dark:border-white/10">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab, index) => {
              const active = index === activeIndex;

              return (
                <button
                  key={`${tab.props.label}-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "rounded-full px-4 py-2 text-[11px] font-mono uppercase tracking-[0.22em] transition",
                    active
                      ? "border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                      : "border border-stone-200/80 bg-stone-50 text-stone-600 hover:bg-stone-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/60 dark:hover:bg-white/[0.06]",
                  )}
                  aria-pressed={active}
                >
                  {tab.props.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="prose prose-stone max-w-none dark:prose-invert">
            {tabs[activeIndex]?.props.children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Tabs;