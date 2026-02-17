import React from 'react';

interface LexiconProps {
  title: string;
  definition: string;
  briefReference?: string;
  children: React.ReactNode;
}

export const LexiconEntry: React.FC<LexiconProps> = ({ title, definition, children }): React.ReactElement => {
  return (
    <article className="lexicon-container p-6 border-l-4 border-gold">
      <header>
        <h2 className="text-2xl font-bold uppercase tracking-tight">{title}</h2>
        <p className="italic text-gray-600 my-2">{definition}</p>
      </header>
      <hr className="my-4 border-gray-200" />
      <div className="prose prose-slate max-w-none">
        {children}
      </div>
    </article>
  );
};