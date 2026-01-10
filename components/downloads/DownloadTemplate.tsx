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
  return (
    <BrandFrame
      title={meta.title}
      subtitle={meta.subtitle || ""}
      pageSize="A4"
      author={meta.author}
      date={meta.date}
    >
      <div className="download-content-wrapper">{children}</div>
    </BrandFrame>
  );
}
