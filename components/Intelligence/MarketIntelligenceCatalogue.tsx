import * as React from "react";
import Link from "next/link";

import {
  getMarketIntelligenceFreshnessLabel,
  getMarketIntelligenceLifecycleBadge,
  type MarketIntelligenceLifecycleRecord,
} from "@/lib/intelligence/market-intelligence-lifecycle";
import {
  getEditionAccessLabel,
  type MarketIntelligenceEditionRecord,
} from "@/lib/intelligence/market-intelligence-editions";

const GOLD = "#C9A96E";
const BASE = "rgb(3,3,5)";
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

type Props = {
  record: MarketIntelligenceLifecycleRecord;
  editions: readonly MarketIntelligenceEditionRecord[];
  className?: string;
};

function LifecycleBadge({
  record,
}: {
  record: MarketIntelligenceLifecycleRecord;
}) {
  const badge = getMarketIntelligenceLifecycleBadge(record);
  const isActive = badge.tone === "active";
  return (
    <span
      style={{
        ...mono,
        fontSize: "7px",
        letterSpacing: "0.20em",
        textTransform: "uppercase",
        color: isActive
          ? "rgba(34,197,94,0.85)"
          : "rgba(245,158,11,0.75)",
        border: `1px solid ${isActive ? "rgba(34,197,94,0.20)" : "rgba(245,158,11,0.20)"}`,
        backgroundColor: isActive
          ? "rgba(34,197,94,0.06)"
          : "rgba(245,158,11,0.06)",
        padding: "2px 8px",
        display: "inline-block",
      }}
    >
      {badge.label}
    </span>
  );
}

function EditionRow({
  edition,
}: {
  edition: MarketIntelligenceEditionRecord;
}) {
  const accessLabel = getEditionAccessLabel(edition.access);
  const isOpen = edition.access === "OPEN";
  const isPaid = edition.access === "PAID";
  const isUnavailable = !edition.available;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "1rem",
        padding: "0.70rem 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        opacity: isUnavailable ? 0.42 : 1,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex flex-wrap items-center gap-2">
          <span
            style={{
              ...mono,
              fontSize: "7px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.52)",
            }}
          >
            {edition.label}
          </span>
          <span
            style={{
              ...mono,
              fontSize: "6.5px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: isOpen
                ? "rgba(34,197,94,0.75)"
                : isPaid
                  ? `${GOLD}CC`
                  : "rgba(255,255,255,0.30)",
              border: `1px solid ${
                isOpen
                  ? "rgba(34,197,94,0.18)"
                  : isPaid
                    ? `${GOLD}30`
                    : "rgba(255,255,255,0.08)"
              }`,
              backgroundColor: isOpen
                ? "rgba(34,197,94,0.05)"
                : isPaid
                  ? `${GOLD}08`
                  : "rgba(255,255,255,0.02)",
              padding: "1px 6px",
            }}
          >
            {accessLabel}
          </span>
        </div>
        <p
          style={{
            marginTop: "0.30rem",
            ...mono,
            fontSize: "7.5px",
            color: "rgba(255,255,255,0.34)",
            lineHeight: 1.7,
          }}
        >
          {edition.description}
        </p>
      </div>

      {edition.available && edition.href ? (
        <Link
          href={edition.href}
          style={{
            flexShrink: 0,
            ...mono,
            fontSize: "7.5px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: isPaid
              ? `${GOLD}CC`
              : isOpen
                ? "rgba(34,197,94,0.80)"
                : "rgba(255,255,255,0.40)",
            whiteSpace: "nowrap",
          }}
        >
          {isPaid ? "Purchase →" : isOpen ? "Read →" : "View →"}
        </Link>
      ) : (
        <span
          style={{
            flexShrink: 0,
            ...mono,
            fontSize: "7px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.20)",
          }}
        >
          In preparation
        </span>
      )}
    </div>
  );
}

export function MarketIntelligenceCatalogue({
  record,
  editions,
  className,
}: Props) {
  const freshnessLabel = getMarketIntelligenceFreshnessLabel(record);
  const badge = getMarketIntelligenceLifecycleBadge(record);

  const metadataRows = [
    { label: "Coverage period",       value: record.coveragePeriod },
    { label: "Current decision window", value: record.decisionWindow },
    { label: "Updated",              value: record.updatedAt ?? "—" },
    { label: "Version",              value: record.version ?? "—" },
    { label: "Status",               value: badge.label },
    ...(record.nextExpected
      ? [
          {
            label: "Next report",
            value: `${record.nextExpected.replace("GMI-", "").replace("-", " ")} — in preparation`,
          },
        ]
      : []),
  ];

  return (
    <section
      className={className}
      style={{
        border: `1px solid ${GOLD}28`,
        background: `${GOLD}06`,
        padding: "1.35rem",
      }}
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        {/* Left — report identity and edition ladder */}
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p
              style={{
                ...mono,
                fontSize: "8px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: `${GOLD}BB`,
              }}
            >
              {record.canonicalLine === "GLOBAL_MARKET_INTELLIGENCE"
                ? "Global Market Intelligence"
                : record.canonicalLine}
            </p>
            <LifecycleBadge record={record} />
          </div>

          <h2
            className="mt-3"
            style={{
              ...serif,
              fontSize: "clamp(1.55rem,3vw,2.45rem)",
              color: "rgba(255,255,255,0.90)",
              lineHeight: 1.05,
            }}
          >
            {record.title}
          </h2>

          <p
            className="mt-3"
            style={{
              ...mono,
              fontSize: "8px",
              letterSpacing: "0.14em",
              color: `${GOLD}AA`,
              textTransform: "uppercase",
            }}
          >
            {freshnessLabel}
          </p>

          {record.freshnessNote ? (
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/46">
              {record.freshnessNote}
            </p>
          ) : null}

          {/* Edition ladder */}
          {editions.length > 0 ? (
            <div className="mt-5">
              {editions.map((edition) => (
                <EditionRow key={edition.edition} edition={edition} />
              ))}
            </div>
          ) : null}

          {/* Primary CTAs */}
          <div className="mt-5 flex flex-wrap gap-4">
            {record.publicHref ? (
              <Link
                href={record.publicHref}
                style={{
                  color: "rgba(255,255,255,0.72)",
                  ...mono,
                  fontSize: "8px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                Read public brief →
              </Link>
            ) : null}
            {record.institutionalHref ? (
              <Link
                href={record.institutionalHref}
                style={{
                  color: `${GOLD}CC`,
                  ...mono,
                  fontSize: "8px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                Access institutional edition →
              </Link>
            ) : null}
          </div>
        </div>

        {/* Right — metadata grid */}
        <div className="grid gap-px bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-1">
          {metadataRows.map((item) => (
            <div
              key={item.label}
              style={{ backgroundColor: BASE, padding: "0.95rem" }}
            >
              <div
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.20em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.32)",
                }}
              >
                {item.label}
              </div>
              <div className="mt-2 text-sm leading-6 text-white/70">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
