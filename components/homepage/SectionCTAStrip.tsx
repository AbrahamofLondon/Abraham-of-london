import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HOMEPAGE_GOLD, mono } from "@/components/homepage/homepagePrimitives";

type CTA = {
  label: string;
  href: string;
  primary?: boolean;
};

export default function SectionCTAStrip({ ctas }: { ctas: CTA[] }) {
  return (
    <div
      className="border-t border-b border-white/[0.04] px-6 py-5"
      style={{ backgroundColor: "rgb(3,3,5)" }}
    >
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-3">
        {ctas.map((cta) => (
          <Link
            key={cta.href}
            href={cta.href}
            className="group inline-flex min-h-[40px] items-center gap-2 border px-5 py-2.5 transition-all duration-150 hover:-translate-y-px"
            style={{
              borderColor: cta.primary ? `${HOMEPAGE_GOLD}50` : "rgba(255,255,255,0.09)",
              backgroundColor: cta.primary ? `${HOMEPAGE_GOLD}12` : "transparent",
              color: cta.primary ? "#F5F5F5" : "rgba(255,255,255,0.42)",
              ...mono,
              fontSize: "9px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            {cta.label}
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </div>
  );
}
