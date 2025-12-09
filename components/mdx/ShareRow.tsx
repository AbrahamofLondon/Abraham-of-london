// components/mdx/ShareRow.tsx
import * as React from "react";

export interface ShareRowProps {
  url: string;
  title: string;
}

export function ShareRow({ url, title }: ShareRowProps): JSX.Element {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const twitterHref = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
  const linkedinHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const whatsappHref = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;

  return (
    <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
      <span className="font-medium text-muted-foreground">Share:</span>
      <a
        href={twitterHref}
        target="_blank"
        rel="noreferrer"
        className="underline"
      >
        X / Twitter
      </a>
      <a
        href={linkedinHref}
        target="_blank"
        rel="noreferrer"
        className="underline"
      >
        LinkedIn
      </a>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        className="underline"
      >
        WhatsApp
      </a>
    </div>
  );
}

export default ShareRow;
