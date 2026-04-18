import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getContentRouteRecommendation, type ContentIntent, type ContentSurface } from "@/lib/content/routing";

const GOLD = "#C9A96E";

export default function NextStepCTA({
  surface,
  intent,
  title = "Next step",
}: {
  surface: ContentSurface;
  intent?: ContentIntent;
  title?: string;
}) {
  const recommendation = getContentRouteRecommendation(surface, intent);

  return (
    <div
      style={{
        border: `1px solid ${GOLD}18`,
        backgroundColor: `${GOLD}06`,
        padding: "1.25rem 1.5rem",
      }}
    >
      <div
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "7px",
          letterSpacing: "0.34em",
          textTransform: "uppercase",
          color: `${GOLD}90`,
          marginBottom: "0.65rem",
        }}
      >
        {title}
      </div>
      <p
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontWeight: 300,
          fontSize: "0.98rem",
          lineHeight: 1.65,
          color: "rgba(255,255,255,0.62)",
          marginBottom: "1rem",
        }}
      >
        {recommendation.description}
      </p>
      <Link
        href={recommendation.href}
        className="inline-flex items-center gap-2 transition-opacity hover:opacity-75"
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "8px",
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          color: `${GOLD}BB`,
        }}
      >
        {recommendation.label}
        <ArrowRight style={{ width: "11px", height: "11px" }} />
      </Link>
    </div>
  );
}
