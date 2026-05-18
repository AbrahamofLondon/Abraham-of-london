import * as React from "react";
import { ExternalLink } from "lucide-react";

const GOLD = "#C9A96E";
const COMPANIES_HOUSE_URL =
  "https://find-and-update.company-information.service.gov.uk/company/11549053/officers";

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

type LegalIdentityBlockProps = {
  variant?: "standalone" | "embedded";
};

export default function LegalIdentityBlock({
  variant = "standalone",
}: LegalIdentityBlockProps) {
  const content = (
    <>
      <p className="text-[15px] leading-7 text-white/70">
        Abraham of London is operated by Alomarada Ltd, a UK registered company. Company no. 11549053.
      </p>
      <a
        href={COMPANIES_HOUSE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-[#C9A96E]/80 transition-colors hover:text-[#C9A96E]"
      >
        Verify on Companies House
        <ExternalLink className="h-3 w-3" />
      </a>
    </>
  );

  if (variant === "embedded") {
    return <div className="mt-3 space-y-1">{content}</div>;
  }

  return (
    <section
      style={{
        border: `1px solid ${GOLD}20`,
        backgroundColor: `${GOLD}04`,
        padding: "1rem",
      }}
    >
      <p
        style={{
          ...mono,
          fontSize: "7px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: `${GOLD}88`,
          marginBottom: "0.65rem",
        }}
      >
        Legal identity
      </p>
      <div className="space-y-1">{content}</div>
    </section>
  );
}
