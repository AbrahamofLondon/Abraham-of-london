import Link from "next/link";

export default function InlineCTA() {
  return (
    <div className="mt-8 rounded-2xl border border-[color:var(--color-primary)/0.15] bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-forest">
          Let&apos;s build something enduring.
        </p>
        <div className="flex gap-2">
          <Link
            href="/contact"
            prefetch={false}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Work With Me
          </Link>
          <Link
            href="/newsletter"
            prefetch={false}
            className="rounded-full border border-[color:var(--color-primary)/0.2] px-4 py-2 text-sm font-semibold text-forest hover:bg-forest hover:text-cream"
          >
            Subscribe
          </Link>
        </div>
      </div>
    </div>
  );
}

