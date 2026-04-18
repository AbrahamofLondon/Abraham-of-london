import Link from "next/link";

const PLAYBOOKS = [
  {
    title: "Crisis Alignment Protocol",
    description:
      "What to do when leadership alignment breaks under pressure.",
    href: "/playbooks",
  },
  {
    title: "Execution Breakdown Map",
    description:
      "Diagnose where execution failure actually originates.",
    href: "/playbooks",
  },
  {
    title: "Strategic Drift Correction",
    description:
      "Identify and correct drift before it compounds.",
    href: "/playbooks",
  },
];

export default function PlaybooksSection() {
  return (
    <section
      className="relative"
      style={{ backgroundColor: "var(--ds-background-muted)", color: "var(--ds-text)" }}
    >
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12">
        <div className="max-w-3xl">
          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8px",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "var(--ds-accent)",
            }}
          >
            Operational Playbooks
          </div>
          <h2 className="mt-4 font-['Cormorant_Garamond',Georgia,serif] text-3xl font-light italic leading-[0.96] tracking-[-0.03em] ds-text md:text-4xl">
            How the system is applied in practice
          </h2>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PLAYBOOKS.map((playbook) => (
            <Link
              key={playbook.title}
              href={playbook.href}
              className="group block border p-6 transition"
              style={{
                borderColor: "var(--ds-border)",
                backgroundColor: "var(--ds-panel-alt)",
              }}
            >
              <h3 className="font-['Cormorant_Garamond',Georgia,serif] text-[1.3rem] leading-[1.08] ds-text transition group-hover:text-white">
                {playbook.title}
              </h3>
              <p className="mt-3 text-[14px] leading-[1.75] ds-text-muted">
                {playbook.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
