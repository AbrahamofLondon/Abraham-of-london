import * as React from "react";

export const HOMEPAGE_GOLD = "#C9A96E";

export const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

export const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

export function SectionShell({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string;
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-28 border-t border-white/[0.05] px-6 py-16 md:py-20"
      style={{ backgroundColor: "rgb(3,3,5)" }}
    >
      <div className="mx-auto max-w-[1100px]">
        <div className="max-w-[760px]">
          <p
            style={{
              ...mono,
              fontSize: "9px",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: `${HOMEPAGE_GOLD}88`,
            }}
          >
            {eyebrow}
          </p>
          <h2
            className="mt-4"
            style={{
              ...serif,
              fontSize: "clamp(1.8rem, 4vw, 2.85rem)",
              lineHeight: 1.04,
              color: "rgba(255,255,255,0.90)",
              fontStyle: "italic",
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </h2>
          {description ? (
            <p
              className="mt-4 max-w-[60ch] text-[15px] leading-[1.85]"
              style={{ color: "rgba(255,255,255,0.50)" }}
            >
              {description}
            </p>
          ) : null}
        </div>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}
