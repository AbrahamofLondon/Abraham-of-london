// app-archived/print-disabled/[slug].tsx

import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";

const PrintDisabledPage: React.FC = () => {
  const router = useRouter();
  const slugParam = router.query.slug;

  const slug =
    typeof slugParam === "string"
      ? slugParam
      : Array.isArray(slugParam)
        ? slugParam[0]
        : "";

  const title = "Print View Disabled | Abraham of London";
  const description =
    "This legacy print-only view is no longer active in the live architecture. Please use the main site to read or download the latest version.";

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        {/* Treat this as legacy / non-canonical */}
        {slug && <meta name="robots" content="noindex, nofollow" />}
      </Head>

      <div className="min-h-screen bg-white text-gray-900">
        <main className="mx-auto max-w-3xl px-6 py-12">
          <header className="mb-8 border-b border-gray-200 pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">
              Legacy · Print Layout
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-gray-900">
              This print view has been archived
            </h1>
            {slug && (
              <p className="mt-2 text-sm text-gray-600">
                Requested reference:{" "}
                <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-800">
                  {slug}
                </code>
              </p>
            )}
          </header>

          <section className="space-y-4 text-sm leading-relaxed text-gray-700">
            <p>
              The printable version of this item now lives in the main site
              architecture. To access the most up-to-date copy, return to the
              primary page and use your browser&apos;s standard print controls
              or the download links on the live page.
            </p>

            <p>
              If you arrived here from an old bookmark or email link, the
              underlying content still exists; only this legacy print-only route
              has been retired from the live experience.
            </p>

            <p className="mt-4 text-xs text-gray-500">
              This route is preserved purely for internal reference and will not
              appear in the canonical navigation.
            </p>
          </section>
        </main>
      </div>
    </>
  );
};

export default PrintDisabledPage;