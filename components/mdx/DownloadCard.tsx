// components/mdx/DownloadCard.tsx
import * as React from "react";
import Link from "next/link";

export interface DownloadCardProps {
  title: string;
  description?: string;
  href: string;
  fileType?: string;
  fileSize?: string;
}

export function DownloadCard({
  title,
  description,
  href,
  fileType,
  fileSize,
}: DownloadCardProps): JSX.Element {
  return (
    <article className="flex flex-col gap-2 rounded-xl border border-lightGrey bg-white/80 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-deepCharcoal">{title}</h3>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex gap-2">
          {fileType && <span>{fileType}</span>}
          {fileType && fileSize && <span>&middot;</span>}
          {fileSize && <span>{fileSize}</span>}
        </div>
        <Link
          href={href}
          className="text-xs font-medium text-forest hover:underline"
        >
          Download
        </Link>
      </div>
    </article>
  );
}

export default DownloadCard;
