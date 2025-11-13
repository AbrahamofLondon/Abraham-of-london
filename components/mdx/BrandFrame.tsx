// components/mdx/BrandFrame.tsx
import * as React from "react";

export type PageSize = "A4" | "A5" | "letter" | "legal";

export interface BrandFrameProps {
  title: string;
  subtitle?: string;
  author?: string;
  date?: string;
  pageSize?: PageSize;
  marginsMm?: number;
  category?: string;
  tags?: string[];
  children: React.ReactNode;
}

function getPageSizeClass(pageSize: PageSize): string {
  switch (pageSize) {
    case "A4":
      return "w-[210mm] min-h-[297mm]";
    case "A5":
      return "w-[148mm] min-h-[210mm]";
    case "letter":
      return "w-[216mm] min-h-[279mm]";
    case "legal":
      return "w-[216mm] min-h-[356mm]";
    default:
      return "w-[210mm] min-h-[297mm]";
  }
}

export function BrandFrame({
  title,
  subtitle,
  author,
  date,
  pageSize = "A4",
  marginsMm = 18,
  category,
  tags,
  children,
}: BrandFrameProps): JSX.Element {
  const pageSizeClass = getPageSizeClass(pageSize);
  const marginStyle: React.CSSProperties = {
    padding: `${marginsMm}mm`,
  };

  return (
    <section
      className={`mx-auto bg-white text-deepCharcoal shadow-lg print:shadow-none ${pageSizeClass}`}
      style={marginStyle}
    >
      <header className="border-b border-lightGrey pb-4">
        {category && (
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {category}
          </p>
        )}
        <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
        {(author || date) && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {author && <span>By {author}</span>}
            {author && date && <span>&middot;</span>}
            {date && <span>{date}</span>}
          </div>
        )}
        {tags && tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-forest/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-forest"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>
      <div className="mt-6 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

export default BrandFrame;