/* components/downloads/DownloadTemplate.tsx — V2.3 (STRICT COMPLIANCE) */
"use client";

import * as React from "react";
import { BrandFrame } from "@/components/print/BrandFrame";

export type DownloadTemplateMeta = {
  title: string;
  subtitle?: string;
  author?: string;
  date?: string;
};

/**
 * NOTE: This template is designed for the NEXT.JS WEB PREVIEW.
 * If you are generating a PDF, you must use a separate PDF-specific 
 * primitive wrapper. We use standard HTML here to match your 
 * .tsx content files.
 */
export default function DownloadTemplate({
  meta,
  children,
}: {
  meta: DownloadTemplateMeta;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-[297mm] w-full bg-white p-[20mm] shadow-xl mx-auto">
      {/* V8.7 BrandFrame handles the absolute positioning 
         of the borders and corner blocks.
      */}
      <BrandFrame title={meta.title} subtitle={meta.subtitle}>
        <header className="mb-8 border-b border-amber-600/30 pb-6">
          <h1 className="text-3xl font-serif text-zinc-900">{meta.title}</h1>
          {meta.subtitle && (
            <p className="mt-2 text-xs uppercase tracking-widest text-amber-700">
              {meta.subtitle}
            </p>
          )}
        </header>

        <main className="prose prose-zinc max-w-none">
          {children}
        </main>

        {meta.author && (
          <footer className="absolute bottom-[40mm] right-[20mm] text-[10px] font-mono uppercase text-zinc-400">
            Authored by: {meta.author}
          </footer>
        )}
      </BrandFrame>
    </div>
  );
}