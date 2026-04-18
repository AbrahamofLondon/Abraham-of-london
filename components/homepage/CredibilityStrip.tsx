import Link from "next/link";

const ITEMS = [
  {
    eyebrow: "Governing Model",
    title: "The Architecture of Human Purpose",
    description:
      "The distilled philosophical spine of the Canon. The model the system is built on.",
    href: "/books/the-architecture-of-human-purpose",
    priority: "primary" as const,
  },
  {
    eyebrow: "Intelligence",
    title: "Intelligence Archive",
    description:
      "Market signals, structural breakdowns, and institutional analysis.",
    href: "/artifacts",
  },
  {
    eyebrow: "Playbooks",
    title: "Playbooks",
    description:
      "Operational responses to diagnosed failure modes.",
    href: "/playbooks",
  },
  {
    eyebrow: "Signals",
    title: "Essays & Shorts",
    description:
      "Entry signals that surface structural problems.",
    href: "/blog",
  },
];

export default function CredibilityStrip() {
  return (
    <section
      className="relative"
      style={{ backgroundColor: "var(--ds-background-muted)", color: "var(--ds-text)" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.02),transparent_60%)]" />
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.35fr_1fr_1fr_1fr]">
          {ITEMS.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group block border p-6 transition"
              style={{
                borderColor:
                  item.priority === "primary"
                    ? "rgba(201,169,110,0.35)"
                    : "var(--ds-border)",
                backgroundColor:
                  item.priority === "primary"
                    ? "rgba(201,169,110,0.08)"
                    : "var(--ds-panel-alt)",
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8px",
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "var(--ds-accent)",
                }}
              >
                {item.eyebrow}
              </div>
              <h3
                className="mt-3 font-['Cormorant_Garamond',Georgia,serif] leading-[1.08] ds-text transition group-hover:text-white"
                style={{
                  fontSize: item.priority === "primary" ? "1.8rem" : "1.45rem",
                }}
              >
                {item.title}
              </h3>
              <p className="mt-3 text-[14px] leading-[1.75] ds-text-muted">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
        <p className="mt-4 text-xs text-white/50">
          The system is not built on opinion. It is built on a governing model,
          then applied through diagnostic logic.
        </p>
      </div>
    </section>
  );
}
