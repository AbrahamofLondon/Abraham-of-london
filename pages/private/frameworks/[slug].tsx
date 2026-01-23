/* pages/private/frameworks/[slug].tsx — PRIVATE PREVIEW (INTEGRITY MODE) */
import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { getInnerCircleAccess } from "@/lib/inner-circle";
import { ShieldAlert, Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";

type Props = { slug: string };

const PrivateFrameworkPreviewPage: NextPage<Props> = ({ slug }) => {
  // Use the established private API route for streaming the asset
  const src = `/api/private/frameworks/${encodeURIComponent(slug)}`;

  return (
    <Layout title="Private Framework Preview">
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <main className="mx-auto w-full max-w-6xl px-4 py-12 lg:py-20">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1">
              <ShieldAlert size={12} className="text-gold" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
                Internal Restricted Asset
              </span>
            </div>
            <h1 className="font-serif text-3xl font-semibold text-white md:text-4xl">
              Framework <span className="italic text-gold/90">Preview</span>
            </h1>
            <p className="mt-2 text-sm text-gray-500 max-w-xl">
              Streamed via secure session tunnel. Access is logged and audited. 
              Unauthorized distribution is a breach of institutional mandate.
            </p>
          </div>

          <Link 
            href="/inner-circle/dashboard" 
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-gold transition-colors"
          >
            <ArrowLeft size={14} />
            Return to Vault
          </Link>
        </header>

        {/* SECURE VIEWPORT */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/50">
          <div className="absolute inset-0 flex items-center justify-center -z-10 bg-black">
             <div className="flex flex-col items-center gap-4 text-gray-700">
                <Lock size={40} className="animate-pulse" />
                <span className="text-xs font-mono uppercase tracking-widest">Initialising Secure Stream...</span>
             </div>
          </div>
          
          <iframe
            title="Institutional Framework Preview"
            src={src}
            className="relative z-10 h-[80vh] w-full border-none"
            loading="lazy"
          />
        </div>
      </main>
    </Layout>
  );
};

/**
 * SERVER SIDE: POSTGRES ACCESS ENFORCEMENT
 */
export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const slug = String(ctx.params?.slug || "").trim();
  if (!slug) return { notFound: true };

  try {
    // 1. Establish session integrity via Postgres
    const auth = await getInnerCircleAccess(ctx.req);

    // 2. UX-Friendly Redirect: Send guests to the login gate with return path
    if (!auth.hasAccess) {
      return {
        redirect: {
          destination: `/inner-circle?returnTo=${encodeURIComponent(ctx.resolvedUrl)}`,
          permanent: false,
        },
      };
    }

    // 3. Return sanitized slug for prop injection
    return { props: { slug } };
    
  } catch (error) {
    console.error("[PRIVATE_PREVIEW_SSR_ERROR]", error);
    return {
      redirect: {
        destination: "/locked",
        permanent: false,
      },
    };
  }
};

export default PrivateFrameworkPreviewPage;