"use client";

import * as React from "react";

export type PDFDashboardViewMode = "grid" | "list";

export type PDFItem = {
  id: string;
  title: string;
  description?: string | null;
  updatedAt?: string | null;
  status?: "ready" | "draft" | "missing" | "error" | string;
  href?: string | null;
};

export interface PDFDashboardProps {
  items: PDFItem[];

  /** Optional: initial view */
  initialViewMode?: PDFDashboardViewMode;

  /** When a PDF row/card is opened */
  onPDFOpen?: (pdfId: string) => void;

  /**
   * Optional: generation trigger (used by PDFDataDashboard)
   * If provided, the dashboard will surface a default "Generate" action unless overridden by renderGenerateAction.
   */
  onGenerate?: (pdfId: string) => Promise<void> | void;

  /**
   * Optional: currently generating item id (used for disabling buttons/spinners)
   */
  isGeneratingId?: string | null;

  /**
   * Optional: custom render for the generate action button/slot (call-site uses this)
   */
  renderGenerateAction?: (id: string) => React.ReactNode;

  /** Optional: external className */
  className?: string;
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function PDFDashboard({
  items,
  initialViewMode = "grid",
  onPDFOpen,
  onGenerate,
  isGeneratingId = null,
  renderGenerateAction,
  className,
}: PDFDashboardProps) {
  const [view, setView] = React.useState<PDFDashboardViewMode>(initialViewMode);
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((x) => {
      const t = (x.title || "").toLowerCase();
      const d = (x.description || "").toLowerCase();
      const id = (x.id || "").toLowerCase();
      return t.includes(q) || d.includes(q) || id.includes(q);
    });
  }, [items, query]);

  const renderAction = React.useCallback(
    (id: string) => {
      if (renderGenerateAction) return renderGenerateAction(id);

      // Default action if user did not supply renderGenerateAction
      if (!onGenerate) return null;

      const busy = isGeneratingId === id;

      return (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void onGenerate(id);
          }}
          disabled={busy}
          className={cx(
            "inline-flex items-center justify-center rounded-full px-4 py-2",
            "text-[10px] font-mono uppercase tracking-[0.28em]",
            "border border-white/10 bg-white/[0.03] text-white/75",
            "hover:text-white hover:bg-white/[0.06] hover:border-amber-500/25",
            busy && "opacity-50 cursor-not-allowed"
          )}
        >
          {busy ? "Generating…" : "Generate"}
        </button>
      );
    },
    [renderGenerateAction, onGenerate, isGeneratingId]
  );

  return (
    <section className={cx("w-full", className)}>
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={cx(
              "rounded-full px-4 py-2 text-[10px] font-mono uppercase tracking-[0.28em] transition-all",
              view === "grid"
                ? "bg-amber-500 text-black"
                : "border border-white/10 bg-white/[0.03] text-white/70 hover:text-white hover:bg-white/[0.06]"
            )}
          >
            Grid
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={cx(
              "rounded-full px-4 py-2 text-[10px] font-mono uppercase tracking-[0.28em] transition-all",
              view === "list"
                ? "bg-amber-500 text-black"
                : "border border-white/10 bg-white/[0.03] text-white/70 hover:text-white hover:bg-white/[0.06]"
            )}
          >
            List
          </button>
        </div>

        <div className="w-full sm:w-[360px]">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search PDFs…"
            className={cx(
              "w-full rounded-2xl px-4 py-3",
              "bg-black/40 border border-white/10",
              "text-white/80 placeholder:text-white/30",
              "focus:outline-none focus:ring-2 focus:ring-amber-500/25"
            )}
          />
        </div>
      </div>

      {/* Content */}
      <div className="mt-8">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center text-white/40">
            No PDFs match your search.
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => {
              const busy = isGeneratingId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onPDFOpen?.(item.id)}
                  className={cx(
                    "text-left rounded-3xl border border-white/10 bg-white/[0.02] p-6",
                    "hover:bg-white/[0.04] hover:border-amber-500/25 transition-all"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-amber-200/60">
                        {item.status || "PDF"}
                      </div>
                      <div className="mt-2 font-serif text-xl text-white/90 truncate">
                        {item.title || item.id}
                      </div>
                      {item.description ? (
                        <p className="mt-2 text-sm text-white/45 line-clamp-2">{item.description}</p>
                      ) : null}
                      {item.updatedAt ? (
                        <div className="mt-4 text-[10px] font-mono uppercase tracking-[0.25em] text-white/35">
                          Updated {item.updatedAt}
                        </div>
                      ) : null}
                    </div>

                    <div className="shrink-0">{renderAction(item.id)}</div>
                  </div>

                  {busy ? (
                    <div className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => {
              const busy = isGeneratingId === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onPDFOpen?.(item.id)}
                  className={cx(
                    "w-full text-left rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4",
                    "hover:bg-white/[0.04] hover:border-amber-500/25 transition-all"
                  )}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-amber-200/60">
                          {item.status || "PDF"}
                        </span>
                        {item.updatedAt ? (
                          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/35">
                            Updated {item.updatedAt}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2 font-serif text-lg text-white/90 truncate">
                        {item.title || item.id}
                      </div>

                      {item.description ? (
                        <p className="mt-1 text-sm text-white/45 line-clamp-1">{item.description}</p>
                      ) : null}
                    </div>

                    <div className="shrink-0">{renderAction(item.id)}</div>
                  </div>

                  {busy ? (
                    <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
