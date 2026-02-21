// pages/inner-circle/admin.tsx — PREMIUM PRODUCTION (Router-Safe, Sovereign)
'use client';

import * as React from "react";
import type { NextPage, GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Zap, Globe, Lock, ArrowRight, CheckCircle2 } from "lucide-react";

import Layout from "@/components/Layout";
import { useAccess } from "@/hooks/useAccess";
import { useClientRouter, useClientQuery, useClientIsReady } from "@/lib/router/useClientRouter";
import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext, tierAtLeast } from "@/lib/server/auth/tokenStore.postgres";

const tiers = [
  {
    name: "Public Access",
    price: "Free",
    description: "Foundational insights and public literature.",
    features: ["Standard Intelligence Briefs", "Public Canons", "Monthly Newsletter"],
    cta: "Start Reading",
    href: "/canons",
    featured: false
  },
  {
    name: "Inner Circle",
    price: "Institutional",
    description: "The primary layer of gated frameworks and strategic briefs.",
    features: ["75+ Private Briefs", "Full Canon Access", "Early Manuscript Access", "Priority Downloads"],
    cta: "Apply for Access",
    href: "/inner-circle/resend",
    featured: true
  },
  {
    name: "Private",
    price: "Bespoke",
    description: "Direct advisory and custom intelligence pipelines.",
    features: ["1-on-1 Strategy", "Custom Frameworks", "Direct Messaging", "Advisory Console"],
    cta: "Inquire",
    href: "/contact",
    featured: false
  }
];

interface AdminProps {
  initialAccess?: {
    hasAccess: boolean;
    tier: string;
  };
  error?: string;
}

const InnerCircleIndex: NextPage<AdminProps> = ({ initialAccess, error }) => {
  // ✅ Router-safe hooks
  const router = useClientRouter();
  const query = useClientQuery();
  const isReady = useClientIsReady();
  
  const { hasClearance, isValidating } = useAccess();
  
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // If already authorized, move them to their intelligence dashboard
  React.useEffect(() => {
    if (!mounted || !router) return;
    
    const hasAccess = hasClearance('inner-circle') || initialAccess?.hasAccess;
    if (hasAccess && !isValidating) {
      router.push('/inner-circle/dashboard');
    }
  }, [mounted, router, hasClearance, isValidating, initialAccess]);

  // ✅ Early return during SSR/prerender
  if (!router) {
    return (
      <Layout title="Inner Circle | Institutional Access">
        <div className="min-h-screen bg-black" />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="System Error | Abraham of London">
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
          <div className="max-w-md text-center bg-zinc-950/50 p-12 rounded-3xl border border-red-500/20">
            <ShieldCheck className="h-12 w-12 text-red-500/50 mx-auto mb-6" />
            <h1 className="text-2xl font-serif text-white mb-4">Vault Sync Error</h1>
            <p className="text-zinc-500 mb-8">{error}</p>
            <button
              onClick={() => router.reload()}
              className="bg-gold text-black px-8 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-white transition-all"
            >
              Recalibrate
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Inner Circle | Institutional Access">
      <Head>
        <meta name="description" content="Access the Abraham of London Inner Circle. Exclusive intelligence briefs, private canons, and strategic frameworks." />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white selection:bg-gold/30">
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-20 px-6 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-gold/10 to-transparent pointer-events-none" />
          
          <div className="mx-auto max-w-4xl text-center relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/30 bg-gold/5 backdrop-blur-sm mb-6"
            >
              <ShieldCheck size={14} className="text-gold" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">Institutional Security Active</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-serif text-5xl md:text-7xl mb-8 tracking-tight"
            >
              Elevate Your <span className="italic text-gold">Clearance</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
            >
              The Inner Circle is a dedicated repository for high-fidelity intelligence, 
              providing the frameworks necessary to navigate complex institutional landscapes.
            </motion.p>
          </div>
        </section>

        {/* PRICING/TIERS SECTION */}
        <section className="px-6 pb-32">
          <div className="mx-auto max-w-7xl">
            <div className="grid md:grid-cols-3 gap-8">
              {tiers.map((tier, i) => (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className={`relative p-8 rounded-2xl border ${
                    tier.featured 
                      ? 'border-gold/50 bg-zinc-900/50 shadow-[0_0_50px_-12px_rgba(212,175,55,0.2)]' 
                      : 'border-white/5 bg-zinc-950/50'
                  } backdrop-blur-sm flex flex-col hover:scale-[1.02] transition-transform duration-300`}
                >
                  {tier.featured && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gold text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                      Recommended
                    </div>
                  )}

                  <div className="mb-8">
                    <h3 className="text-gold font-mono text-xs uppercase tracking-[0.3em] mb-4">{tier.name}</h3>
                    <div className="text-3xl font-serif mb-2">{tier.price}</div>
                    <p className="text-zinc-500 text-sm leading-relaxed">{tier.description}</p>
                  </div>

                  <ul className="space-y-4 mb-10 flex-grow">
                    {tier.features.map(feature => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-zinc-300">
                        <CheckCircle2 size={16} className="text-gold mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={tier.href}
                    className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 group ${
                      tier.featured 
                        ? 'bg-gold text-black hover:bg-white' 
                        : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {tier.cta}
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* TRUST FEATURES */}
        <section className="border-t border-white/5 bg-zinc-950/30 py-24 px-6">
          <div className="mx-auto max-w-7xl grid md:grid-cols-3 gap-12">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center text-gold mb-6">
                <Lock size={24} />
              </div>
              <h4 className="font-serif text-xl mb-3 text-white">Privacy First</h4>
              <p className="text-zinc-500 text-sm">Zero-knowledge identity verification. Your engagement remains your own.</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center text-gold mb-6">
                <Zap size={24} />
              </div>
              <h4 className="font-serif text-xl mb-3 text-white">Instant Decryption</h4>
              <p className="text-zinc-500 text-sm">Once verified, the entire 75-brief portfolio is decrypted in your browser.</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center text-gold mb-6">
                <Globe size={24} />
              </div>
              <h4 className="font-serif text-xl mb-3 text-white">Global Access</h4>
              <p className="text-zinc-500 text-sm">Secure institutional access from any sector, any device, any time.</p>
            </motion.div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

/* -----------------------------------------------------------------------------
  SERVER SIDE GATEWAY
----------------------------------------------------------------------------- */
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const sessionId = readAccessCookie(context.req as any);

    if (!sessionId) {
      return { props: { initialAccess: { hasAccess: false, tier: "public" } } };
    }

    const ctx = await getSessionContext(sessionId);
    if (!ctx.session || !ctx.member) {
      return { props: { initialAccess: { hasAccess: false, tier: "public" } } };
    }

    const required = "inner-circle";
    const hasAccess = tierAtLeast(ctx.tier as any, required);

    return {
      props: {
        initialAccess: {
          hasAccess,
          tier: ctx.tier
        }
      },
    };
  } catch (err) {
    console.error("[INNER_CIRCLE_ADMIN_ERROR]:", err);
    return { props: { error: "Vault connectivity lost. Systems re-aligning." } };
  }
};

export default InnerCircleIndex;