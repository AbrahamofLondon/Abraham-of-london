import Link from "next/link";
import type {
  HomepageEditorialSeriesEntry,
  HomepageAppliedSeriesEntry,
  HomepageEditorialViewModel,
} from "@/lib/content/homepage-editorial-series";

const MONO = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
} as const;

// ─── Sub-components ──────────────────────────────────────────────────────────

function EditorialSeriesCard({
  item,
}: {
  item: HomepageEditorialSeriesEntry;
}) {
  const isScheduled = item.statusLabel === "Scheduled";

  return (
    <div
      className="border px-7 py-7 lg:px-9 lg:py-8"
      style={{
        borderColor: isScheduled
          ? "rgba(201,150,58,0.12)"
          : "rgba(201,150,58,0.2)",
        backgroundColor: isScheduled ? "#0D0D0D" : "#0F0F0F",
      }}
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
                color: isScheduled
                  ? "rgba(201,150,58,0.55)"
                  : "#C9963A",
              }}
            >
              Editorial Series · {item.partCount} Parts · {item.statusLabel}
            </span>
          </div>
          <h3
            className="font-serif italic mb-3"
            style={{
              fontWeight: 300,
              fontSize: "clamp(1.3rem, 1.8vw, 1.65rem)",
              lineHeight: 1.1,
              color: isScheduled ? "#C8C4BE" : "#F0EDE8",
            }}
          >
            {item.title}
          </h3>
          <p
            className="text-sm leading-[1.65rem]"
            style={{
              color: isScheduled ? "#6A6A6A" : "#8A8A8A",
              maxWidth: "52ch",
            }}
          >
            {item.description}
          </p>
        </div>
        <div className="flex flex-col gap-3 lg:flex-shrink-0 lg:items-end lg:justify-end lg:pt-1">
          {item.ctaHref ? (
            <Link
              href={item.ctaHref}
              className="inline-flex items-center border px-5 py-2.5 font-mono text-[7.5px] uppercase tracking-[0.28em] transition-colors duration-200"
              style={{
                borderColor: "rgba(201,150,58,0.5)",
                color: "#C9963A",
                backgroundColor: "rgba(201,150,58,0.06)",
                whiteSpace: "nowrap",
              }}
            >
              {item.ctaLabel}
            </Link>
          ) : (
            <span
              className="inline-flex items-center border px-5 py-2.5 font-mono text-[7.5px] uppercase tracking-[0.28em]"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.25)",
                backgroundColor: "rgba(255,255,255,0.03)",
                whiteSpace: "nowrap",
                cursor: "default",
              }}
            >
              {item.ctaLabel}
            </span>
          )}
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
  );
}

function AppliedSeriesCard({
  item,
}: {
  item: HomepageAppliedSeriesEntry;
}) {
  return (
    <Link
      href={item.href}
      className="group block transition-colors duration-200"
      style={{ backgroundColor: "#0F0F0F" }}
    >
      <div className="px-6 py-5 transition-colors duration-200 group-hover:bg-[rgba(201,150,58,0.04)]">
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
          Applied Series · {item.partCount} Parts · {item.statusLabel}
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
          {item.title}
        </div>
        <p
          className="text-[11.5px] leading-[1.6rem] mb-4"
          style={{ color: "#6A6A6A", maxWidth: "50ch" }}
        >
          {item.description}
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
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

type Props = {
  editorialViewModel: HomepageEditorialViewModel;
};

export default function EditorialIntelligenceBand({
  editorialViewModel,
}: Props) {
  const { editorialSeries, appliedSeries } = editorialViewModel;

  return (
    <section
      aria-label="Editorial Intelligence"
      style={{
        backgroundColor: "#111010",
        borderTop: "1px solid rgba(201,150,58,0.15)",
        borderBottom: "1px solid rgba(201,150,58,0.15)",
      }}
      className="px-6 py-16 lg:px-12 lg:py-20"
    >
      <div className="mx-auto max-w-5xl">
        {/* Section label */}
        <div className="flex items-center gap-3 mb-8">
          <span
            style={{
              width: 1,
              height: 16,
              backgroundColor: "#C9963A",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
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

        {/* Editorial Series — dynamically resolved from contentlayer */}
        {editorialSeries.length > 0 ? (
          <div className="space-y-3">
            {editorialSeries.map((item) => (
              <EditorialSeriesCard key={item.slug} item={item} />
            ))}
          </div>
        ) : null}

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
          {appliedSeries.length > 0 ? (
            <div
              className="grid gap-px"
              style={{
                gridTemplateColumns: `repeat(${appliedSeries.length}, 1fr)`,
                backgroundColor: "rgba(201,150,58,0.1)",
              }}
            >
              {appliedSeries.map((item) => (
                <AppliedSeriesCard key={item.slug} item={item} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
