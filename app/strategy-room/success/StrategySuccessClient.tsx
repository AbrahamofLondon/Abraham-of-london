'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, ArrowRight, Mail, RefreshCw, Loader2, FileText, Clock } from 'lucide-react';
import Link from 'next/link';
import { useClientIsReady } from '@/lib/router/useClientRouter';

const CONTAINER_TRANSITION = {
  duration: 0.8,
  ease: [0.22, 1, 0.36, 1] as const
};

function StrategySuccessContent() {
  const isReady = useClientIsReady();
  const searchParams = useSearchParams();
  const id = searchParams?.get('id') ?? null;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function fetchResults() {
      if (!id) return;
      try {
        const res = await fetch(`/api/strategy-room/results?id=${id}`);
        if (!res.ok) throw new Error('Data retrieval failed');
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error("Failed to retrieve session data", err);
      } finally {
        setLoading(false);
      }
    }
    if (isReady) fetchResults();
  }, [id, isReady]);

  if (!mounted || !isReady || loading) {
    return (
      <div className="min-h-screen bg-[#060609] flex flex-col items-center justify-center space-y-6">
        <Loader2 className="animate-spin text-amber-500" size={28} />
        <p className="text-zinc-400 text-sm tracking-wide">
          Loading your session details...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#060609] flex flex-col items-center justify-center space-y-6 px-6">
        <AlertTriangle className="text-amber-500" size={32} />
        <h2 className="text-xl font-semibold text-white">Session not found</h2>
        <p className="text-zinc-400 text-sm text-center max-w-md leading-6">
          We could not locate the details for this session. If you have just completed payment,
          it may take a moment to process. Please check your email for confirmation, or contact
          support if this persists.
        </p>
        <div className="flex gap-4 mt-4">
          <Link
            href="/strategy-room"
            className="min-h-[44px] inline-flex items-center gap-2 px-6 py-3 border border-amber-500/30 text-amber-400 text-sm font-medium hover:bg-amber-500/10 transition-colors"
          >
            Return to Strategy Room
          </Link>
          <a
            href="mailto:info@abrahamoflondon.org"
            className="min-h-[44px] inline-flex items-center gap-2 px-6 py-3 border border-white/10 text-zinc-300 text-sm hover:bg-white/5 transition-colors"
          >
            <Mail size={14} />
            Contact support
          </a>
        </div>
      </div>
    );
  }

  const score = data?.readinessScore ?? 0;

  return (
    <div className="min-h-screen bg-[#060609] text-white px-6 py-12 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={CONTAINER_TRANSITION}
        className="max-w-3xl mx-auto"
      >
        {/* Confirmation header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <CheckCircle className="text-emerald-400" size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif italic text-white/95 mb-3">
            Payment confirmed
          </h1>
          <p className="text-zinc-400 text-base leading-7 max-w-lg mx-auto">
            Your Strategy Room session has been secured. A confirmation receipt has been sent
            to your email address.
          </p>
          {id && (
            <p className="mt-3 text-zinc-500 text-xs font-mono tracking-wide">
              Reference: {id.slice(-8).toUpperCase()}
            </p>
          )}
        </div>

        {/* Readiness score (if available) */}
        {score > 0 && (
          <div className="border border-white/10 bg-white/[0.02] p-6 mb-8">
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2 font-medium">
              Readiness assessment
            </p>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-semibold text-white">{score}%</span>
              <span className="text-zinc-500 text-sm">operational readiness</span>
            </div>
            {data?.volatility && (
              <p className="mt-3 text-zinc-400 text-sm">
                Market context: <span className="text-white/70">{data.volatility}</span>
              </p>
            )}
          </div>
        )}

        {/* What happens next */}
        <div className="border border-white/10 bg-white/[0.02] p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">What happens next</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Mail size={14} className="text-amber-400" />
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium">Check your email</p>
                <p className="text-zinc-400 text-sm leading-6">
                  A payment receipt and session details have been sent to your email address.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Clock size={14} className="text-amber-400" />
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium">Session preparation</p>
                <p className="text-zinc-400 text-sm leading-6">
                  Your session materials are being prepared based on your diagnostic evidence.
                  You will receive access instructions within one business day.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <FileText size={14} className="text-amber-400" />
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium">Session summary</p>
                <p className="text-zinc-400 text-sm leading-6">
                  After your session, a written summary of decisions and action items will
                  be provided for your records.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <Link
            href="/vault/briefs"
            className="min-h-[44px] group flex items-center justify-between p-5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 transition-colors"
          >
            <div>
              <span className="text-white font-medium block text-sm">Access briefings</span>
              <span className="text-zinc-500 text-xs mt-1 block">Review available materials</span>
            </div>
            <ArrowRight size={16} className="text-zinc-500 group-hover:text-amber-400 transition-colors" />
          </Link>

          <Link
            href="/strategy-room"
            className="min-h-[44px] group flex items-center justify-between p-5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 transition-colors"
          >
            <div>
              <span className="text-white font-medium block text-sm">Strategy Room</span>
              <span className="text-zinc-500 text-xs mt-1 block">Return to your workspace</span>
            </div>
            <ArrowRight size={16} className="text-zinc-500 group-hover:text-amber-400 transition-colors" />
          </Link>
        </div>

        {/* Support and policy links */}
        <div className="border-t border-white/10 pt-8 text-center space-y-4">
          <p className="text-zinc-500 text-sm">
            Questions about your session?{" "}
            <a
              href="mailto:info@abrahamoflondon.org"
              className="text-amber-400/80 hover:text-amber-300"
            >
              Contact support
            </a>
          </p>
          <div className="flex justify-center gap-6 text-xs text-zinc-500">
            <Link href="/refund-policy" className="hover:text-zinc-300 transition-colors">
              Refund policy
            </Link>
            <Link href="/terms-of-service" className="hover:text-zinc-300 transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function StrategySuccessPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#060609]" aria-busy="true" />
      }
    >
      <StrategySuccessContent />
    </React.Suspense>
  );
}
