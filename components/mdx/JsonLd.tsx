/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";

type JsonLdProps = {
  data: any; // Using any for high-tolerance input from MDX
  type?: string;
} & Omit<
  React.HTMLAttributes<HTMLScriptElement>,
  "type" | "dangerouslySetInnerHTML"
>;

/**
 * Institutional JsonLd Component
 * Prevents "Object as React child" by ensuring strict stringification 
 * before it ever touches the React reconciliation tree.
 */
export default function JsonLd({
  data,
  type = "application/ld+json",
  ...rest
}: JsonLdProps) {
  
  // 🛡️ Firebreak: Return null early if data is missing to prevent {} in the source
  if (!data) return null;

  const jsonString = React.useMemo(() => {
    try {
      // If data is already a string (common in some MDX setups), return it.
      // Otherwise, stringify the object.
      return typeof data === "string" ? data : JSON.stringify(data);
    } catch (error) {
      console.error("JsonLd: Serialization Failure", error);
      return null; // Return null to avoid rendering a broken script tag
    }
  }, [data]);

  if (!jsonString) return null;

  return (
    <script
      type={type}
      // This is the only place the data exists—safely inside the script tag's inner HTML.
      dangerouslySetInnerHTML={{ __html: jsonString }}
      {...rest}
    />
  );
}