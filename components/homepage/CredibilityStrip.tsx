import Link from "next/link";

const ITEMS = [
  {
    eyebrow: "Intelligence",
    title: "Q1 Market Intelligence Report",
    description:
      "Where structural breakdown actually occurs across organisations.",
    href: "/artifacts",
  },
  {
    eyebrow: "Playbook",
    title: "Board Decision Discipline",
    description:
      "How high-stakes decisions actually break down in practice.",
    href: "/playbooks",
  },
  {
    eyebrow: "Essay",
    title: "You Don't Have a Growth Problem",
    description:
      "Most organisations misdiagnose structural issues as execution failures.",
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
        <div className="grid gap-4 md:grid-cols-3">
          {ITEMS.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group block border p-6 transition"
              style={{
                borderColor: "var(--ds-border)",
                backgroundColor: "var(--ds-panel-alt)",
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
              <h3 className="mt-3 font-['Cormorant_Garamond',Georgia,serif] text-[1.45rem] leading-[1.08] ds-text transition group-hover:text-white">
                {item.title}
              </h3>
              <p className="mt-3 text-[14px] leading-[1.75] ds-text-muted">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
