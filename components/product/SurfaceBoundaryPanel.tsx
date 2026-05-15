import Link from "next/link";

export type SurfaceBoundaryPanelProps = {
  surfaceType:
    | "PUBLIC_INSTRUMENT"
    | "SESSION_PREVIEW"
    | "PUBLIC_SAMPLE"
    | "PUBLIC_EXPLAINER"
    | "PAID_LAYER"
    | "ACCOUNT_RECORD"
    | "GOVERNED_CASE";
  recordCreated: string;
  systemReads: string[];
  nextAction: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
};

const GOLD = "#C9A96E";
const mono = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

const SURFACE_LABEL: Record<SurfaceBoundaryPanelProps["surfaceType"], string> = {
  PUBLIC_INSTRUMENT: "Public instrument",
  SESSION_PREVIEW: "Session preview",
  PUBLIC_SAMPLE: "Public sample",
  PUBLIC_EXPLAINER: "Public explainer",
  PAID_LAYER: "Paid layer",
  ACCOUNT_RECORD: "Account record",
  GOVERNED_CASE: "Governed case",
};

export default function SurfaceBoundaryPanel({
  surfaceType,
  recordCreated,
  systemReads,
  nextAction,
  secondaryAction,
}: SurfaceBoundaryPanelProps) {
  return (
    <section
      style={{
        border: `1px solid ${GOLD}20`,
        backgroundColor: `${GOLD}04`,
        padding: "1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          alignItems: "center",
          marginBottom: "0.85rem",
        }}
      >
        <span
          style={{
            ...mono,
            fontSize: "7px",
            letterSpacing: "0.20em",
            textTransform: "uppercase",
            color: `${GOLD}CC`,
            border: `1px solid ${GOLD}32`,
            backgroundColor: `${GOLD}08`,
            padding: "0.2rem 0.55rem",
          }}
        >
          {SURFACE_LABEL[surfaceType]}
        </span>
        <span
          style={{
            ...mono,
            fontSize: "7px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.28)",
          }}
        >
          Surface boundary
        </span>
      </div>

      <div style={{ display: "grid", gap: "0.9rem" }}>
        <div>
          <p
            style={{
              ...mono,
              fontSize: "7px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.28)",
              marginBottom: "0.35rem",
            }}
          >
            Record created
          </p>
          <p
            style={{
              ...serif,
              fontSize: "0.92rem",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.62)",
            }}
          >
            {recordCreated}
          </p>
        </div>

        <div>
          <p
            style={{
              ...mono,
              fontSize: "7px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.28)",
              marginBottom: "0.35rem",
            }}
          >
            What the system reads
          </p>
          <ul
            style={{
              margin: 0,
              paddingLeft: "1rem",
              color: "rgba(255,255,255,0.54)",
            }}
          >
            {systemReads.map((item) => (
              <li
                key={item}
                style={{
                  ...serif,
                  fontSize: "0.9rem",
                  lineHeight: 1.6,
                  marginBottom: "0.2rem",
                }}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <Link
            href={nextAction.href}
            style={{
              display: "inline-flex",
              alignItems: "center",
              border: `1px solid ${GOLD}45`,
              backgroundColor: `${GOLD}10`,
              color: "#F5F5F5",
              textDecoration: "none",
              padding: "0.65rem 0.9rem",
              ...mono,
              fontSize: "8px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            {nextAction.label}
          </Link>

          {secondaryAction && (
            <Link
              href={secondaryAction.href}
              style={{
                display: "inline-flex",
                alignItems: "center",
                border: "1px solid rgba(255,255,255,0.10)",
                color: "rgba(255,255,255,0.48)",
                textDecoration: "none",
                padding: "0.65rem 0.9rem",
                ...mono,
                fontSize: "8px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
              }}
            >
              {secondaryAction.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
