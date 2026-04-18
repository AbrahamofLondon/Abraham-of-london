import Link from "next/link";

export default function ModelBasisNote() {
  return (
    <div
      style={{
        marginTop: "3rem",
        borderLeft: "1px solid rgba(201,169,110,0.30)",
        paddingLeft: "1.5rem",
      }}
    >
      <p
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "12px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "rgba(201,169,110,0.70)",
        }}
      >
        Basis of Interpretation
      </p>

      <p
        style={{
          marginTop: "0.75rem",
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontSize: "0.95rem",
          lineHeight: 1.7,
          color: "rgba(255,255,255,0.60)",
        }}
      >
        This assessment is derived from a constitutional model of institutional
        behavior, not from generic benchmarks or industry averages.
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
        The underlying framework defines how authority, coherence, pressure,
        and constraint interact within a system. Your output reflects how your
        situation aligns with or deviates from that structure.
      </p>

      <Link
        href="/books/the-architecture-of-human-purpose"
        style={{
          display: "inline-block",
          marginTop: "1rem",
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "12px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "rgba(252,211,77,0.85)",
        }}
      >
        Review the model →
      </Link>
    </div>
  );
}
