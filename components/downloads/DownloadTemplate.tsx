import * as React from "react";
import BrandFrame from "@/components/print/BrandFrame";

export type DownloadTemplateMeta = {
  title: string;
  subtitle?: string;
  author?: string;
  date?: string;
};

export default function DownloadTemplate({
  meta,
  children,
}: {
  meta: DownloadTemplateMeta;
  children: React.ReactNode;
}) {
  // Create props object that satisfies exactOptionalPropertyTypes
  const brandFrameProps = {
    title: meta.title,
    subtitle: meta.subtitle || "",
    pageSize: "A4" as const,
    children: <div className="download-content-wrapper">{children}</div>
  };
  
  // Conditionally add optional properties only when they have values
  if (meta.author !== undefined) {
    (brandFrameProps as any).author = meta.author;
  }
  
  if (meta.date !== undefined) {
    (brandFrameProps as any).date = meta.date;
  }

  return <BrandFrame {...brandFrameProps} />;
}