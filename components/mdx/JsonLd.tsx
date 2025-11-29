// components/mdx/JsonLd.tsx
import * as React from "react";

type JsonLdProps = {
  data: unknown;
  type?: string;
} & Omit<
  React.HTMLAttributes<HTMLScriptElement>,
  "type" | "dangerouslySetInnerHTML"
>;

export default function JsonLd({
  data,
  type = "application/ld+json",
  ...rest
}: JsonLdProps) {
  // Safely stringify data with error handling
  const jsonString = React.useMemo(() => {
    try {
      return JSON.stringify(data);
    } catch (error) {
      console.error("JsonLd: Failed to stringify data", error);
      return "{}";
    }
  }, [data]);

  return (
    <script
      type={type}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: jsonString }}
      {...rest}
    />
  );
}
