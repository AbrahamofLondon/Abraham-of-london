type FreeLayerBoundaryProps = {
  summary: string;
  limitation: string;
};

export default function FreeLayerBoundary({
  summary,
  limitation,
}: FreeLayerBoundaryProps) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.10)",
        backgroundColor: "rgba(255,255,255,0.03)",
        padding: "1.25rem",
      }}
    >
      <div
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "7px",
          letterSpacing: "0.30em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.52)",
          marginBottom: "0.55rem",
        }}
      >
        Boundary of this layer
      </div>
      <p
        style={{
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          fontSize: "0.95rem",
          lineHeight: 1.8,
          color: "rgba(255,255,255,0.82)",
          maxWidth: "62ch",
        }}
      >
        {summary}
      </p>
      <p
        style={{
          marginTop: "0.5rem",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          fontSize: "0.92rem",
          lineHeight: 1.8,
          color: "rgba(255,255,255,0.68)",
          maxWidth: "62ch",
        }}
      >
        {limitation}
      </p>
    </div>
  );
}
