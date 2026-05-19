import * as React from "react";
import Link from "next/link";

import {
  getMarketIntelligenceLifecycleBadge,
  type MarketIntelligenceLifecycleRecord,
} from "@/lib/intelligence/market-intelligence-lifecycle";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

type Props = {
  records: readonly MarketIntelligenceLifecycleRecord[];
  className?: string;
};

function groupByYear(
  records: readonly MarketIntelligenceLifecycleRecord[],
): Map<number, MarketIntelligenceLifecycleRecord[]> {
  const map = new Map<number, MarketIntelligenceLifecycleRecord[]>();
  for (const record of records) {
    const existing = map.get(record.year) ?? [];
    existing.push(record);
    map.set(record.year, existing);
  }
  return map;
}

function ChronologyEntry({
  record,
}: {
  record: MarketIntelligenceLifecycleRecord;
}) {
  const badge = getMarketIntelligenceLifecycleBadge(record);
  const isActive = badge.tone === "active";
  const isDraft = badge.tone === "draft";
  const href = record.publicHref ?? record.institutionalHref ?? "";

  return (
    <article
      style={{
        borderLeft: `2px solid ${
          isActive ? GOLD : isDraft ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.10)"
        }`,
        paddingLeft: "16px",
      }}
    >
      <p
        style={{
          ...mono,
          fontSize: "8px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.34)",
        }}
      >
        {record.year} · {record.quarter} {record.year}
      </p>

      <h3 className="mt-2 text-base leading-snug text-white/82">
        {record.title}
      </h3>

      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <span
          style={{
            ...mono,
            fontSize: "7px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: isActive
              ? "rgba(34,197,94,0.75)"
              : "rgba(255,255,255,0.30)",
            border: `1px solid ${
              isActive ? "rgba(34,197,94,0.18)" : "rgba(255,255,255,0.08)"
            }`,
            backgroundColor: isActive
              ? "rgba(34,197,94,0.05)"
              : "rgba(255,255,255,0.02)",
            padding: "1px 6px",
          }}
        >
          {badge.label}
        </span>
        {record.decisionWindow ? (
          <span
            style={{
              ...mono,
              fontSize: "7px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: `${GOLD}80`,
            }}
          >
            Decision window: {record.decisionWindow}
          </span>
        ) : null}
      </div>

      <div className="mt-2.5">
        {href && isActive ? (
          <Link
            href={href}
            style={{
              color: `${GOLD}CC`,
              ...mono,
              fontSize: "7.5px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Access report →
          </Link>
        ) : (
          <span
            style={{
              ...mono,
              fontSize: "7.5px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.25)",
            }}
          >
            {isDraft ? "In preparation" : badge.label}
          </span>
        )}
      </div>
    </article>
  );
}

export function MarketIntelligenceChronology({ records, className }: Props) {
  const grouped = groupByYear(records);
  const years = Array.from(grouped.keys()).sort((a, b) => b - a);

  return (
    <div className={className}>
      {years.map((year) => {
        const yearRecords = grouped.get(year) ?? [];
        return (
          <div key={year} className={years.indexOf(year) > 0 ? "mt-8" : ""}>
            <p
              style={{
                ...mono,
                fontSize: "8px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: `${GOLD}BB`,
                marginBottom: "1rem",
              }}
            >
              {year}
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {yearRecords.map((record) => (
                <ChronologyEntry key={record.id} record={record} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
