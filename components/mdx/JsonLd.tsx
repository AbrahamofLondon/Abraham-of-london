// components/mdx/JsonLd.tsx
import * as React from "react";

type JsonLdProps = {
  data: unknown;
  type?: string; // default: application/ld+json
} & React.HTMLAttributes<HTMLScriptElement>;

export default function JsonLd({ data, type = "application/ld+json", ...rest }: JsonLdProps) {
  return (
    <script
      type={type}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      {...rest}
    />
  );
}
