import { FC } from "react";

interface JsonLdProps {
  data: unknown;
}

export const JsonLd: FC<JsonLdProps> = ({ data }) => {
  return (
    <script
      type="application/ld+json"
      // `data` is treated as opaque JSON-serialisable content
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
};