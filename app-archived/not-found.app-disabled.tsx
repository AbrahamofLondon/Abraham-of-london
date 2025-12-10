// app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center max-w-md">
        <p className="text-sm font-semibold text-gray-500 mb-2">
          404 – Page not found
        </p>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          That page doesn&apos;t exist.
        </h1>
        <p className="text-gray-600 mb-6">
          The link may be outdated or the page might have been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center rounded-full bg-deepCharcoal px-5 py-2.5 text-sm font-semibold text-cream hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-deepCharcoal"
        >
          Go back home
        </Link>
      </div>
    </main>
  );
}
