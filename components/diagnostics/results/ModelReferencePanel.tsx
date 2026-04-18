import Link from "next/link";

const GOLD = "#C9A96E";

export default function ModelReferencePanel() {
  return (
    <div
      style={{
        marginTop: "2.5rem",
        border: "1px solid rgba(255,255,255,0.10)",
        backgroundColor: "rgba(255,255,255,0.02)",
        padding: "1.5rem",
      }}
    >
      <p
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "10px",
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "rgba(201,169,110,0.70)",
        }}
      >
        Governing Model
      </p>

      <h3
        style={{
          marginTop: "0.75rem",
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontSize: "1.5rem",
          fontStyle: "italic",
          color: "rgba(255,255,255,0.94)",
        }}
      >
        The Architecture of Human Purpose
      </h3>

      <p
        style={{
          marginTop: "0.75rem",
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontSize: "0.95rem",
          lineHeight: 1.7,
          color: "rgba(255,255,255,0.60)",
        }}
      >
        This assessment is not derived from isolated metrics. It is evaluated
        against a governing model of institutional purpose, authority,
        coherence, and constraint.
      </p>

      <p
        style={{
          marginTop: "0.5rem",
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontSize: "0.95rem",
          lineHeight: 1.7,
          color: "rgba(255,255,255,0.50)",
        }}
      >
        The Architecture of Human Purpose is the distilled framework behind the
        Canon. It is the standard used to interpret structural alignment,
        failure modes, and readiness.
      </p>

      <div style={{ marginTop: "1rem" }}>
        <Link
          href="/books/the-architecture-of-human-purpose"
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "12px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(252,211,77,0.85)",
          }}
        >
          View the model →
        </Link>
      </div>
    </div>
  );
}
