// pages/works-in-progress.tsx
import * as React from "react";
import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";

import Layout from "@/components/Layout";

type WipCardProps = {
  title: string;
  subtitle: string;
  href: string;
  tag: string;
  imageSrc: string;
};

const WipCard: React.FC<WipCardProps> = ({
  title,
  subtitle,
  href,
  tag,
  imageSrc,
}) => (
  <Link href={href} className="group block">
    <article className="flex items-start gap-4 rounded-2xl border border-gray-200/20 bg-black/80 p-4 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-500/40 hover:shadow-amber-500/20">
      <div className="relative h-20 w-14 overflow-hidden rounded-md bg-gray-900">
        <Image
          src={imageSrc}
          alt={title}
          fill
          sizes="80px"
          className="object-cover"
        />
      </div>
      <div className="flex-1">
        <div className="mb-1 flex items-center gap-2">
          <h3 className="font-serif text-sm font-semibold text-ivory">
            {title}
          </h3>
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-widest text-amber-300">
            {tag}
          </span>
        </div>
        <p className="text-xs text-ivory/60">{subtitle}</p>
      </div>
      <div className="text-amber-400 opacity-70 transition-transform duration-300 group-hover:translate-x-1">
        →
      </div>
    </article>
  </Link>
);

const WorksInProgressPage: NextPage = () => {
  return (
    <Layout title="Works in Progress | Abraham of London">
      <main className="min-h-screen bg-gradient-to-b from-charcoal via-softBlack to-charcoal">
        {/* Hero */}
        <section className="border-b border-softGold/10 py-16">
          <div className="container mx-auto max-w-4xl px-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-softGold">
              Drafts · Experiments · Forthcoming
            </p>
            <h1 className="mb-4 font-serif text-3xl font-light text-ivory sm:text-4xl">
              Works in Progress
            </h1>
            <p className="text-sm text-ivory/70">
              Live projects that are currently being written, edited, or
              architected. These are the pages where the Canon, the memoir, and
              the fiction adaptation are being forged in real time.
            </p>
          </div>
        </section>

        {/* List */}
        <section className="py-16">
          <div className="container mx-auto max-w-3xl px-6 space-y-4">
            <WipCard
              title="Fathering Without Fear"
              subtitle="Memoir and strategic narrative for fathers who refuse to disappear."
              href="/books/fathering-without-fear"
              tag="Memoir Draft"
              imageSrc="/assets/images/books/fathering-without-fear.jpg"
            />
            <WipCard
              title="The Fiction Adaptation"
              subtitle="A covert retelling - where fiction says what the courtroom cannot."
              href="/books/the-fiction-adaptation"
              tag="Fiction Draft"
              imageSrc="/assets/images/books/the-fiction-adaptation.jpg"
            />
            <WipCard
              title="Canon - Future Volumes"
              subtitle="Forthcoming Canon volumes and frameworks currently in research and outline."
              href="/canon"
              tag="Canon Roadmap"
              imageSrc="/assets/images/books/the-architecture-of-human-purpose.jpg"
            />
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default WorksInProgressPage;

