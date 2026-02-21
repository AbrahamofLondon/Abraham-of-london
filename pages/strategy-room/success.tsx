/* pages/strategy-room/success.tsx — BULLETPROOF (Router-Safe) */
import * as React from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import { CheckCircle, Shield, FileText, ArrowRight } from "lucide-react";
import { useClientRouter, useClientQuery, useClientIsReady } from "@/lib/router/useClientRouter";

export default function IntakeSuccess() {
  // ✅ Router-safe hooks
  const router = useClientRouter();
  const query = useClientQuery();
  const isReady = useClientIsReady();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ Safe access to query params
  const id = mounted && query ? query.id : null;
  const refCode = id ? String(id).substring(0, 8).toUpperCase() : "PROCESSING...";

  // ✅ Early return during SSR/prerender
  if (!mounted || !router) {
    return (
      <Layout title="Transmission Successful | Abraham of London" className="bg-black">
        <div className="min-h-screen bg-black" />
      </Layout>
    );
  }

  return (
    <Layout title="Transmission Successful | Abraham of London" className="bg-black">
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-xl w-full border border-zinc-800 bg-zinc-950/50 p-8 md:p-12 font-mono relative overflow-hidden">
          
          {/* Subtle Background Mark */}
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Shield size={120} />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 text-emerald-500 mb-6">
              <CheckCircle size={20} />
              <span className="uppercase tracking-[0.4em] text-xs font-bold">Transmission_Verified</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-sans font-bold text-white mb-4 tracking-tight">
              Dossier Logged.
            </h1>

            <p className="text-zinc-400 text-sm leading-relaxed mb-8">
              Your institutional diagnostic has been ingested by the Strategy Room engine. 
              The Directorate is currently auditing the gravity of your inputs against our 
              foundational frameworks.
            </p>

            <div className="bg-black border border-zinc-800 p-6 mb-10">
              <div className="text-[10px] text-zinc-600 uppercase mb-2 tracking-widest">Reference_Archive_ID</div>
              <div className="text-xl text-zinc-200 tracking-[0.2em] font-bold">
                {refCode}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="mt-1 p-1 bg-zinc-900 border border-zinc-800">
                   <FileText size={14} className="text-zinc-500" />
                </div>
                <div>
                  <h3 className="text-white text-xs uppercase font-bold mb-1">Audit Phase</h3>
                  <p className="text-zinc-500 text-[11px]">The Scoring Engine is calculating volatility and dependency ratios.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="mt-1 p-1 bg-zinc-900 border border-zinc-800">
                   <Shield size={14} className="text-zinc-500" />
                </div>
                <div>
                  <h3 className="text-white text-xs uppercase font-bold mb-1">Access Protocol</h3>
                  <p className="text-zinc-500 text-[11px]">If the Gravity Score clears the threshold, you will be invited to the Inner Circle.</p>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-zinc-900">
              <Link 
                href="/"
                className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors uppercase text-[10px] tracking-widest"
              >
                Return to Foundation <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}

/* -----------------------------------------------------------------------------
  SERVER SIDE PROPS (Force SSR to avoid static generation)
----------------------------------------------------------------------------- */
export const getServerSideProps = async () => {
  return { props: {} };
};