import * as React from "react";
import LexiconCard from "./LexiconCard";

type LexiconItem = {
  slug: string;
  title: string;
  definition: string;
  category?: string;
  tags?: string[];
  isFeatured?: boolean;
};

type LexiconGridProps = {
  items: LexiconItem[];
};

export default function LexiconGrid({ items }: LexiconGridProps): React.ReactElement {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-10 flex flex-col items-start justify-between gap-4 border-l-2 border-amber-500 pl-6 md:flex-row md:items-end">
        <div>
          <h2 className="font-serif text-4xl font-bold tracking-tighter text-white">
            Lexicon of Sovereignty
          </h2>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
            Institutional Definitions & Strategic Terminology
          </p>
        </div>
        <div className="font-mono text-[10px] text-zinc-600">
          COUNT: {items.length.toString().padStart(2, '0')} ENTRIES
        </div>
      </div>

      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <LexiconCard key={item.slug} {...item} />
        ))}
      </div>
    </section>
  );
}