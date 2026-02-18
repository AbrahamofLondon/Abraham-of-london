import React from 'react';
import { MDXRemoteSerializeResult } from 'next-mdx-remote';
import { MDXRemote } from 'next-mdx-remote';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Info, AlertCircle } from 'lucide-react';

// Custom MDX components with proper typing
const mdxComponents = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="text-3xl md:text-4xl font-serif italic text-stone-900 mb-6" {...props} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="text-2xl md:text-3xl font-serif italic text-stone-800 mt-12 mb-4" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="text-xl md:text-2xl font-serif text-stone-800 mt-8 mb-3" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="text-stone-600 text-lg leading-relaxed mb-6 font-light" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc list-inside space-y-2 mb-6 text-stone-600" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal list-inside space-y-2 mb-6 text-stone-600" {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="text-stone-600 font-light" {...props} />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLElement>) => (
    <blockquote className="border-l-4 border-amber-500 pl-6 italic text-stone-700 my-8" {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a className="text-amber-600 hover:text-amber-700 underline underline-offset-4 transition-colors" {...props} />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code className="bg-stone-100 px-1.5 py-0.5 rounded text-sm font-mono text-stone-800" {...props} />
  ),
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre className="bg-stone-900 text-stone-100 p-4 rounded-lg overflow-x-auto mb-6" {...props} />
  ),
};

interface ShortContentProps {
  content: MDXRemoteSerializeResult;
  transcript?: string | null;
  components?: Record<string, React.ComponentType<any>>;
  onTranscriptCopy?: () => void;
  className?: string;
}

const ShortContent: React.FC<ShortContentProps> = ({ 
  content, 
  transcript, 
  components = {},
  onTranscriptCopy,
  className = "",
}) => {
  const [copied, setCopied] = React.useState(false);
  
  // Merge default components with custom components
  const mergedComponents = React.useMemo(
    () => ({
      ...mdxComponents,
      ...components,
    }),
    [components]
  );

  const handleCopyTranscript = React.useCallback(async () => {
    if (!transcript) return;
    
    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      onTranscriptCopy?.();
      
      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy transcript:', error);
    }
  }, [transcript, onTranscriptCopy]);

  return (
    <div className={`space-y-12 ${className}`}>
      {/* Main content with premium styling */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        className="bg-gradient-to-br from-white to-stone-50 rounded-3xl shadow-sm border border-stone-200/50 p-8 md:p-12"
      >
        <article className="prose prose-stone prose-lg max-w-none prose-headings:font-serif prose-headings:italic prose-p:font-light prose-p:leading-relaxed prose-strong:text-amber-700 prose-strong:font-medium">
          <MDXRemote {...content} components={mergedComponents} />
        </article>
      </motion.div>

      {/* Transcript section with animation */}
      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            className="bg-gradient-to-br from-stone-50 to-white rounded-3xl border border-stone-200/50 p-8 md:p-10"
          >
            {/* Header with copy button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="font-serif text-2xl italic text-stone-900 mb-2">
                  Video Transcript
                </h3>
                <p className="text-sm text-stone-500 font-light">
                  Complete transcript of the briefing
                </p>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCopyTranscript}
                className={`
                  inline-flex items-center gap-2 px-5 py-2.5 rounded-full
                  font-mono text-xs uppercase tracking-wider transition-all
                  ${copied 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-stone-900 text-stone-100 hover:bg-stone-800'
                  }
                `}
                aria-label={copied ? 'Copied!' : 'Copy transcript'}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy</span>
                  </>
                )}
              </motion.button>
            </div>

            {/* Transcript content */}
            <div className="bg-white rounded-2xl border border-stone-200/60 p-6 md:p-8">
              <div className="prose prose-stone max-w-none">
                {transcript.split('\n').map((paragraph, index) => {
                  // Skip empty paragraphs
                  if (!paragraph.trim()) return null;
                  
                  return (
                    <motion.p
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="text-stone-700 leading-relaxed mb-6 font-light"
                    >
                      {paragraph}
                    </motion.p>
                  );
                })}
              </div>
            </div>
            
            {/* Disclaimer with icon */}
            <div className="mt-6 flex items-start gap-3 text-sm text-stone-500 bg-stone-100/50 p-4 rounded-xl">
              <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <span className="font-light leading-relaxed">
                This transcript was automatically generated and may contain minor inaccuracies. 
                Please refer to the original audio for precise content.
              </span>
            </div>

            {/* Word count indicator (subtle premium touch) */}
            <div className="mt-4 text-right">
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">
                {transcript.split(/\s+/).length} words • {transcript.length} characters
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state with proper typing */}
      {!transcript && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-stone-50/50 rounded-3xl border border-stone-200/30 p-12 text-center"
        >
          <AlertCircle className="h-8 w-8 text-stone-400 mx-auto mb-4" />
          <p className="text-stone-500 font-light">
            No transcript available for this briefing.
          </p>
        </motion.div>
      )}
    </div>
  );
};

// Type guard for MDXRemoteSerializeResult
export const isMDXContent = (content: unknown): content is MDXRemoteSerializeResult => {
  return (
    typeof content === 'object' &&
    content !== null &&
    'compiledSource' in content &&
    'frontmatter' in content
  );
};

export default ShortContent;