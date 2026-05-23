import Link from "next/link";

const MONO = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
} as const;

const APPLIED_SERIES = [
  {
    href: "/blog/series/the-burden-changes-hands",
    meta: "Applied Series · 7 Parts · Complete",
    title: "The Burden Changes Hands",
    body: "Seven essays on memory, custody, and the intelligence organisations build — or fail to build — over time.",
  },
  {
    href: "/blog/series/the-science-of-inherited-selves",
    meta: "Applied Series · 8 Parts · In Progress",
    title: "The Science of Inherited Selves",
    body: "Six essays on inheritance, attachment, family memory, trauma, and the responsibility to interrupt what should not be passed on.",
  },
];

export default function EditorialIntelligenceBand() {
  return (
    <section
      aria-label="Editorial Intelligence"
      style={{ backgroundColor: "#111010", borderTop: "1px solid rgba(201,150,58,0.15)", borderBottom: "1px solid rgba(201,150,58,0.15)" }}
      className="px-6 py-16 lg:px-12 lg:py-20"
    >
      <div className="mx-auto max-w-5xl">

        {/* Section label */}
        <div className="flex items-center gap-3 mb-8">
          <span style={{ width: 1, height: 16, backgroundColor: "#C9963A", display: "inline-block", flexShrink: 0 }} />
          <span
            style={{
              ...MONO,
              fontSize: "7px",
              letterSpacing: "0.38em",
              textTransform: "uppercase",
              color: "#C9963A",
            }}
          >
            Editorial Intelligence
          </span>
        </div>

        {/* Heading */}
        <h2
          className="font-serif italic mb-5"
          style={{
            fontWeight: 300,
            fontSize: "clamp(1.5rem, 2.4vw, 2rem)",
            lineHeight: 1.05,
            color: "#F0EDE8",
            maxWidth: "36ch",
          }}
        >
          The public record behind the operating doctrine.
        </h2>

        {/* Body copy */}
        <p
          className="mb-10 text-sm leading-[1.7rem]"
          style={{ color: "#8A8A8A", maxWidth: "60ch" }}
        >
          Abraham of London's editorial series examine the ideas, habits,
          technologies, and moral pressures shaping modern judgment. They do not
          replace the product spine; they clarify the intellectual terrain
          behind it.
        </p>

        {/* Featured series card — The Mind's Clay */}
        <div
          className="border px-7 py-7 lg:px-9 lg:py-8"
          style={{ borderColor: "rgba(201,150,58,0.2)", backgroundColor: "#0F0F0F" }}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span
                  style={{
                    ...MONO,
                    fontSize: "7px",
                    letterSpacing: "0.32em",
                    textTransform: "uppercase",
                    color: "#C9963A",
                  }}
                >
                  Editorial Series · 9 Parts · Complete
                </span>
              </div>
              <h3
                className="font-serif italic mb-3"
                style={{
                  fontWeight: 300,
                  fontSize: "clamp(1.3rem, 1.8vw, 1.65rem)",
                  lineHeight: 1.1,
                  color: "#F0EDE8",
                }}
              >
                The Mind's Clay
              </h3>
              <p
                className="text-sm leading-[1.65rem]"
                style={{ color: "#8A8A8A", maxWidth: "52ch" }}
              >
                A nine-part editorial serial on memory, writing, attention,
                authorship, and the technologies that shape the human mind.
              </p>
            </div>
            <div className="flex flex-col gap-3 lg:flex-shrink-0 lg:items-end lg:justify-end lg:pt-1">
              <Link
                href="/editorials/series/the-minds-clay"
                className="inline-flex items-center border px-5 py-2.5 font-mono text-[7.5px] uppercase tracking-[0.28em] transition-colors duration-200"
                style={{
                  borderColor: "rgba(201,150,58,0.5)",
                  color: "#C9963A",
                  backgroundColor: "rgba(201,150,58,0.06)",
                  whiteSpace: "nowrap",
                }}
              >
                Enter the series
              </Link>
              <Link
                href="/editorials"
                className="inline-flex items-center px-5 py-2 font-mono text-[7px] uppercase tracking-[0.26em] transition-colors duration-200"
                style={{ color: "#5A5A5A" }}
              >
                View all editorials →
              </Link>
            </div>
          </div>
        </div>

        {/* Applied Essay Series — secondary row */}
        <div className="mt-3">
          {/* Row label */}
          <div className="flex items-center gap-3 mb-3 px-1">
            <span
              style={{
                ...MONO,
                fontSize: "7px",
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: "rgba(201,150,58,0.55)",
              }}
            >
              Applied Essay Series
            </span>
          </div>

          {/* Cards */}
          <div
            className="grid gap-px"
            style={{
              gridTemplateColumns: `repeat(${APPLIED_SERIES.length}, 1fr)`,
              backgroundColor: "rgba(201,150,58,0.1)",
            }}
          >
            {APPLIED_SERIES.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="group block transition-colors duration-200"
                style={{ backgroundColor: "#0F0F0F" }}
              >
                <div
                  className="px-6 py-5 transition-colors duration-200 group-hover:bg-[rgba(201,150,58,0.04)]"
                >
                  <div
                    style={{
                      ...MONO,
                      fontSize: "6.5px",
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                      color: "rgba(201,150,58,0.5)",
                      marginBottom: "0.6rem",
                    }}
                  >
                    {s.meta}
                  </div>
                  <div
                    className="font-serif italic mb-2 transition-colors duration-200 group-hover:text-white"
                    style={{
                      fontWeight: 300,
                      fontSize: "clamp(0.9rem, 1.2vw, 1.05rem)",
                      lineHeight: 1.15,
                      color: "#D8D4CE",
                    }}
                  >
                    {s.title}
                  </div>
                  <p
                    className="text-[11.5px] leading-[1.6rem] mb-4"
                    style={{ color: "#6A6A6A", maxWidth: "50ch" }}
                  >
                    {s.body}
                  </p>
                  <span
                    className="transition-colors duration-200 group-hover:text-[#C9963A]"
                    style={{
                      ...MONO,
                      fontSize: "7px",
                      letterSpacing: "0.24em",
                      textTransform: "uppercase",
                      color: "#484848",
                    }}
                  >
                    Enter the series →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
