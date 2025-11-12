// app/downloads/page.tsx
import * as React from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { getDownloads } from "@/lib/downloads"; // ✅ Fixed import
import { Download } from "@/lib/downloads"; // Import the type if needed

function toArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]).filter(Boolean) : [];
}

export default function DownloadsPage() {
  const downloads = getDownloads(); // ✅ This now returns the array directly
  const title = "Downloads";
  const desc = "Curated playbooks, briefs, and cue cards for leaders and founders.";

  return (
    <Layout pageTitle={title}>
      <SEOHead title={title} description={desc} slug="/downloads" type="website" />
      <main className="container mx-auto max-w-6xl px-4 py-12">
        <header className="mb-8">
          <h1 className="text-4xl font-serif font-bold">{title}</h1>
          <p className="mt-3 max-w-2xl text-[color:var(--color-on-secondary)/0.85]">{desc}</p>
        </header>

        {downloads.length ? (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {downloads.map((d, i) => (
              <li key={d._id ?? i} className="rounded-2xl border border-lightGrey bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-deepCharcoal">{d.title}</h3>
                {d.excerpt && (
                  <p className="mt-2 text-[color:var(--color-on-secondary)/0.85]">{d.excerpt}</p>
                )}
                {d.subtitle && (
                  <p className="mt-1 text-sm text-[color:var(--color-on-secondary)/0.7]">{d.subtitle}</p>
                )}
                <Link 
                  href={`/downloads/${d.slug}`} 
                  prefetch={false} 
                  className="mt-3 inline-block text-forest hover:underline"
                >
                  View →
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <section className="rounded-2xl border border-dashed border-lightGrey p-8 text-center">
            <p className="text-sm text-[color:var(--color-on-secondary)/0.7]">
              No downloads available at the moment.
            </p>
          </section>
        )}
      </main>
    </Layout>
  );
}