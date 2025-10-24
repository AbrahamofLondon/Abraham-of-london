// app/(site)/downloads/page.tsx
import Link from "next/link";
import { getDownloads } from "@/lib/downloads";

export const dynamic = "force-static"; // build-time snapshot; rebuild on deploy

export default async function DownloadsPage() {
  const items = getDownloads();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-6 text-4xl font-serif">Downloads</h1>
      <p className="mb-8 text-[color:var(--color-on-secondary)/0.85]">
        Everything in this list is read straight from <code>/public/downloads</code>.
        Drop in a new PDF and it appears here on next build.
      </p>

      {items.length === 0 ? (
        <p>No downloads yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((d) => (
            <li key={d.file} className="rounded-2xl border border-lightGrey bg-white p-4 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-deepCharcoal">
                    <Link href={d.href} className="luxury-link">{d.title}</Link>
                  </h2>
                  <div className="mt-1 text-sm text-[color:var(--color-on-secondary)/0.7]">
                    {d.size} updated {new Date(d.modified).toLocaleDateString()}
                  </div>
                  <div className="mt-2 break-all text-xs text-[color:var(--color-on-secondary)/0.6]">
                    {d.href}
                  </div>
                </div>
                <Link href={d.href} className="aol-btn text-sm" prefetch={false}>
                  Download
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
