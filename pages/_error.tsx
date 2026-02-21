// pages/_error.tsx — EXPORT-SAFE (NO Layout, NO next/router, NO useRouter)
import * as React from "react";
import Head from "next/head";
import type { NextPage, NextPageContext } from "next";

type Props = {
  statusCode?: number;
};

const ErrorPage: NextPage<Props> = ({ statusCode }) => {
  const code = typeof statusCode === "number" ? statusCode : 500;

  const title =
    code === 404 ? "Page not found | Abraham of London" : "Server error | Abraham of London";

  const label =
    code === 404 ? "Missing Artifact" : "Server Incident";

  const headline =
    code === 404 ? "404 — Not found" : "500 — Internal error";

  const message =
    code === 404
      ? "The archive has no record of this route. Verify the address."
      : "The archive is intact. The interface failed. Try again.";

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="max-w-xl text-center">
          <div className="mb-6 text-xs font-mono uppercase tracking-[0.35em] text-white/50">
            {label}
          </div>

          <h1 className="text-3xl md:text-5xl font-light tracking-tight">{headline}</h1>

          <p className="mt-4 text-white/60">{message}</p>

          <div className="mt-10 flex items-center justify-center gap-3">
            <a
              href="/"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10 transition inline-block"
            >
              Return Home
            </a>

            <a
              href="/about"
              className="rounded-xl border border-white/10 bg-black px-5 py-3 text-sm font-semibold hover:bg-white/5 transition inline-block"
            >
              About
            </a>
          </div>

          <div className="mt-10 text-[10px] font-mono uppercase tracking-[0.35em] text-white/25">
            Code: {code}
          </div>
        </div>
      </div>
    </>
  );
};

// IMPORTANT: getInitialProps is allowed here; it runs in the error pipeline.
// No router usage, no Layout usage.
ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 500;
  return { statusCode };
};

export default ErrorPage;