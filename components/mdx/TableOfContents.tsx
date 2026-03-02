/* components/mdx/TableOfContents.tsx */
"use client";

import * as React from "react";
import { ChevronRight, Navigation } from "lucide-react";
import { safeString, safeNumber, classNames } from "@/lib/utils/safe";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  contentRef?: React.RefObject<HTMLElement>;
  className?: string;
  maxHeadings?: number;
}

function getHeadingLevel(heading: Element): number {
  const tag = safeString((heading as any)?.tagName).toUpperCase();
  const m = tag.match(/^H([1-6])$/);
  const n = m ? safeNumber(m[1], 2) : 2;
  return n >= 1 && n <= 6 ? n : 2;
}

function makeId(text: string, index: number) {
  const base = safeString(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 60);

  return base ? `${base}` : `section-${index}`;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  contentRef,
  className = "",
  maxHeadings = 50,
}) => {
  const [headings, setHeadings] = React.useState<Heading[]>([]);
  const [activeId, setActiveId] = React.useState<string>("");

  React.useEffect(() => {
    const root =
      contentRef?.current ||
      (document.querySelector(".aol-mdx-content") as HTMLElement | null) ||
      (document.querySelector("main") as HTMLElement | null) ||
      document.body;

    if (!root) return;

    const selector = "h2, h3, h4, h5";
    const list = Array.from(root.querySelectorAll(selector));

    const extracted: Heading[] = [];
    for (let i = 0; i < list.length && extracted.length < maxHeadings; i++) {
      const el = list[i] as HTMLElement;
      const text = safeString(el.textContent);
      if (!text.trim()) continue;

      let id = safeString(el.id);
      if (!id) {
        id = makeId(text, i);
        try {
          el.id = id;
        } catch {
          // ignore
        }
      }

      extracted.push({ id, text, level: getHeadingLevel(el) });
    }

    setHeadings(extracted);

    // Observe active heading
    const targets = extracted
      .map((h) => document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[];

    if (!targets.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (a.boundingClientRect.top ?? 0) - (b.boundingClientRect.top ?? 0));

        const top = visible[0]?.target as HTMLElement | undefined;
        if (top?.id) setActiveId(top.id);
      },
      { root: null, rootMargin: "-20% 0% -70% 0%", threshold: 0.1 }
    );

    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [contentRef, maxHeadings]);

  const scrollToHeading = React.useCallback((id: string, event: React.MouseEvent) => {
    event.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;

    const offset = 120;
    const y = el.getBoundingClientRect().top + window.pageYOffset - offset;

    window.scrollTo({ top: y, behavior: "smooth" });
    window.history.pushState({}, "", `#${id}`);
    setActiveId(id);
  }, []);

  if (!headings.length) return null;

  return (
    <aside className={classNames("my-10", className)}>
      <nav className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
        <div className="px-6 py-5 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/30">
              <Navigation className="w-4 h-4 text-amber-200/70" />
            </span>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-amber-200/70">
                In This Article
              </div>
              <div className="mt-1 text-xs text-white/45">{headings.length} sections</div>
            </div>
          </div>

          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/35">
            {(headings.findIndex((h) => h.id === activeId) + 1) || 0} of {headings.length}
          </div>
        </div>

        <div className="px-4 py-4">
          <ul className="space-y-1 max-h-[60vh] overflow-y-auto pr-2">
            {headings.map((h) => {
              const isActive = activeId === h.id;
              const indent =
                h.level === 3 ? "pl-4" : h.level === 4 ? "pl-8" : h.level >= 5 ? "pl-12" : "";

              return (
                <li key={h.id} className={indent}>
                  <a
                    href={`#${h.id}`}
                    onClick={(e) => scrollToHeading(h.id, e)}
                    className={classNames(
                      "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-amber-500/10 text-amber-200 border border-amber-500/15"
                        : "text-white/70 hover:text-white hover:bg-white/[0.03] border border-transparent"
                    )}
                  >
                    <span
                      className={classNames(
                        "h-2.5 w-2.5 rounded-full transition-colors",
                        isActive ? "bg-amber-400" : "bg-white/20 group-hover:bg-white/30"
                      )}
                    />
                    <span className="line-clamp-2 leading-relaxed flex-1">{h.text}</span>
                    {isActive && <ChevronRight className="w-4 h-4 text-amber-300/80 flex-shrink-0" />}
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-white/45">
              <span className="h-2 w-2 rounded-full bg-amber-400/70 animate-pulse" />
              <span>Currently reading</span>
            </div>
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/35">
              {activeId ? safeString(headings.find((x) => x.id === activeId)?.text) : "—"}
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
};

export const SafeTableOfContents: React.FC<TableOfContentsProps> = (props) => {
  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => setIsClient(true), []);
  if (!isClient) return null;
  return <TableOfContents {...props} />;
};

export default TableOfContents;