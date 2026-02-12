/* components/BriefContent.tsx */
import { FC } from 'react';
import { format, parseISO } from 'date-fns';

interface BriefContentProps {
  brief: {
    title: string;
    date?: string;
    classification?: string;
    author?: string;
    body: {
      html: string;
    };
    readingTime?: { text: string };
  };
}

const BriefContent: FC<BriefContentProps> = ({ brief }) => {
  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      {/* Institutional Header */}
      <header className="mb-12 border-b border-zinc-200 dark:border-zinc-800 pb-8">
        <div className="flex items-center gap-4 mb-4">
          <span className="px-3 py-1 text-xs font-mono uppercase tracking-widest bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded">
            {brief.classification || "Unclassified"}
          </span>
          {brief.date && (
            <time className="text-sm text-zinc-500 font-mono">
              {format(parseISO(brief.date), 'dd MMM yyyy').toUpperCase()}
            </time>
          )}
        </div>
        
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-zinc-900 dark:text-zinc-100 mb-6 leading-tight">
          {brief.title}
        </h1>

        <div className="flex items-center justify-between text-zinc-500 text-sm">
          <span>{brief.author || "Abraham of London"}</span>
          <span>{brief.readingTime?.text || "5 min read"}</span>
        </div>
      </header>

      {/* Main Intelligence Body */}
      <div 
        className="prose prose-zinc dark:prose-invert prose-lg max-w-none 
                   prose-headings:font-serif prose-headings:font-semibold 
                   prose-blockquote:border-amber-500 prose-blockquote:bg-zinc-50 
                   dark:prose-blockquote:bg-zinc-900/50 prose-blockquote:py-1"
        dangerouslySetInnerHTML={{ __html: brief.body.html }} 
      />

      {/* Institutional Footer */}
      <footer className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800">
        <p className="text-xs text-zinc-400 font-mono uppercase tracking-tighter">
          End of Briefing // Institutional Asset ID: {Math.random().toString(36).substring(7).toUpperCase()}
        </p>
      </footer>
    </article>
  );
};

export default BriefContent;