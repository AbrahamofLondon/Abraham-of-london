import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";

import {
  safeAuthClientMessage,
  sanitizeAuthErrorParam,
  type AuthSafeErrorCode,
} from "@/lib/auth/auth-error-classifier";

type Props = {
  code: AuthSafeErrorCode;
  message: string;
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const raw = Array.isArray(ctx.query.error) ? ctx.query.error[0] : ctx.query.error;
  return {
    props: {
      code: sanitizeAuthErrorParam(raw),
      message: safeAuthClientMessage(),
    },
  };
};

export default function AuthErrorPage({
  code,
  message,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <>
      <Head>
        <title>Authentication unavailable | Abraham of London</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <main className="flex min-h-screen items-center justify-center bg-black px-6 py-16 text-white">
        <section className="max-w-lg border border-white/10 bg-zinc-950 p-8">
          <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/35">
            Authentication
          </p>
          <h1 className="mt-3 font-serif text-3xl">Sign-in unavailable</h1>
          <p className="mt-4 text-sm leading-6 text-white/62">{message}</p>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
            Reference: {code}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/auth/signin"
              className="border border-amber-400/25 bg-amber-400/10 px-4 py-2 text-xs text-amber-100"
            >
              Try sign in again
            </Link>
            <Link
              href="/contact"
              className="border border-white/10 px-4 py-2 text-xs text-white/58"
            >
              Contact support
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
