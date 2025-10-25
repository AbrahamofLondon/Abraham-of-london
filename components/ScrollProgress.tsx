"use client";

import * as React from "react";

type Props = {
  /** e.g., "h-1" */
  heightClass?: string;
  /** e.g., "bg-emerald-600" */
  colorClass?: string;
  /** e.g., "z-50" */
  zIndexClass?: string;
};

export default function ScrollProgress({
  heightClass = "h-1",
  colorClass = "bg-emerald-600",
  zIndexClass = "z-50",
}: Props) {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrollTop = el.scrollTop || document.body.scrollTop;
      const scrollHeight =
        (el.scrollHeight || document.body.scrollHeight) - el.clientHeight;
      const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      setProgress(Math.max(0, Math.min(100, pct)));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      className={`fixed left-0 top-0 w-full ${zIndexClass}`}
      aria-hidden="true"
    >
      <div
        className={`${heightClass} ${colorClass}`}
        style={{ width: `${progress}%`, transition: "width 120ms linear" }}
      />
    </div>
  );
}
