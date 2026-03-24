"use client";

import React from "react";
import { useMDXComponent } from "next-contentlayer2/hooks";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Info, AlertCircle, FileText } from "lucide-react";

const mdxComponents = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1
      className="mt-12 mb-5 font-serif text-3xl leading-tight tracking-[-0.03em] text-stone-950 md:text-4xl"
      {...props}
    />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className="mt-14 mb-4 border-t border-stone-200/80 pt-8 font-serif text-2xl leading-tight tracking-[-0.02em] text-stone-900 md:text-3xl"
      {...props}
    />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      className="mt-10 mb-3 font-sans text-lg font-semibold uppercase tracking-[0.08em] text-stone-800 md:text-xl"
      {...props}
    />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-6 text-[1.02rem] leading-8 text-stone-700 md:text-lg" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="mb-6 list-disc space-y-2 pl-6 text-stone-700 marker:text-amber-600" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="mb-6 list-decimal space-y-2 pl-6 text-stone-700 marker:text-amber-700" {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="leading-8" {...props} />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLElement>) => (
    <blockquote
      className="my-10 rounded-r-2xl border-l-[3px] border-amber-600 bg-gradient-to-r from-amber-50 to-transparent px-6 py-4 font-serif text-xl italic leading-9 text-stone-800"
      {...props}
    />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      className="font-medium text-amber-700 underline decoration-amber-400/60 underline-offset-4 transition-colors hover:text-amber-800"
      {...props}
    />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-stone-900" {...props} />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code
      className="rounded-md border border-stone-200 bg-stone-100 px-1.5 py-0.5 font-mono text-[0.92em] text-stone-900"
      {...props}
    />
  ),
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre
      className="mb-8 overflow-x-auto rounded-2xl border border-stone-800 bg-stone-950 p-5 text-sm text-stone-100 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.45)]"
      {...props}
    />
  ),
  hr: (props: React.HTMLAttributes<HTMLHRElement>) => (
    <hr className="my-10 border-none border-t border-stone-200" {...props} />
  ),
};

interface ShortContentProps {
  code: string;
  transcript?: string | null;
  components?: Record<string, React.ComponentType<any>>;
  onTranscriptCopy?: () => void;
  className?: string;
}

const ShortContent: React.FC<ShortContentProps> = ({
  code,
  transcript,
  components = {},
  onTranscriptCopy,
  className = "",
}) => {
  const [copied, setCopied] = React.useState(false);

  const mergedComponents = React.useMemo(
    () => ({
      ...mdxComponents,
      ...components,
    }),
    [components]
  );

  const MDXContent = useMDXComponent(code);

  const handleCopyTranscript = React.useCallback(async () => {
    if (!transcript) return;

    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      onTranscriptCopy?.();
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("Failed to copy transcript:", error);
    }
  }, [transcript, onTranscriptCopy]);

  const transcriptWordCount = React.useMemo(
    () => (transcript ? transcript.trim().split(/\s+/).filter(Boolean).length : 0),
    [transcript]
  );

  return (
    <div className={`space-y-12 ${className}`}>
      {/* Main reading panel */}
      <motion.section
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative overflow-hidden rounded-[2rem] border border-stone-200/70 bg-[linear-gradient(180deg,#ffffff_0%,#fcfbf8_100%)] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.18)]"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/35 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.06),transparent_38%)]" />

        <div className="relative px-6 py-8 md:px-10 md:py-10 lg:px-14 lg:py-12">
          <div className="mb-8 flex items-center gap-3">
            <div className="h-px w-10 bg-gradient-to-r from-amber-500/70 to-amber-500/10" />
            <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-stone-500">
              Reading Room
            </span>
          </div>

          <article className="prose prose-stone max-w-none prose-p:my-0 prose-headings:scroll-mt-28">
            {MDXContent ? <MDXContent components={mergedComponents} /> : null}
          </article>
        </div>
      </motion.section>

      {/* Transcript */}
      <AnimatePresence>
        {transcript ? (
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
            className="overflow-hidden rounded-[2rem] border border-stone-200/70 bg-[linear-gradient(180deg,#fafaf9_0%,#ffffff_100%)] shadow-[0_26px_70px_-42px_rgba(0,0,0,0.14)]"
          >
            <div className="border-b border-stone-200/80 px-6 py-5 md:px-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-amber-700" />
                    <h3 className="font-serif text-2xl text-stone-950">Transcript</h3>
                  </div>
                  <p className="mt-1 text-sm text-stone-500">
                    Full transcript for study, reuse, and quotation.
                  </p>
                </div>

                <button
                  onClick={handleCopyTranscript}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-mono uppercase tracking-[0.22em] transition-all ${
                    copied
                      ? "bg-emerald-600 text-white"
                      : "border border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50"
                  }`}
                  aria-label={copied ? "Transcript copied" : "Copy transcript"}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div className="px-6 py-6 md:px-8 md:py-8">
              <div className="rounded-[1.5rem] border border-stone-200 bg-white px-5 py-6 md:px-7 md:py-7">
                {transcript
                  .split("\n")
                  .map((paragraph, index) =>
                    paragraph.trim() ? (
                      <motion.p
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(index * 0.015, 0.2) }}
                        className="mb-5 text-[1rem] leading-8 text-stone-700 last:mb-0"
                      >
                        {paragraph}
                      </motion.p>
                    ) : null
                  )}
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-stone-200/80 bg-stone-50 px-4 py-4 text-sm text-stone-600">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <span className="leading-6">
                  This transcript may include minor automated transcription errors. Verify sensitive quotations against the original media before formal use.
                </span>
              </div>

              <div className="mt-4 text-right">
                <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-stone-400">
                  {transcriptWordCount} words
                </span>
              </div>
            </div>
          </motion.section>
        ) : (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-[2rem] border border-dashed border-stone-300 bg-stone-50/70 px-8 py-12 text-center"
          >
            <AlertCircle className="mx-auto mb-4 h-8 w-8 text-stone-400" />
            <p className="text-stone-500">No transcript is available for this short.</p>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShortContent;