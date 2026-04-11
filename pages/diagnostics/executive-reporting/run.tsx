import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function ExecutiveReportingRunPage() {
  const [status, setStatus] = React.useState<"idle" | "loading" | "complete">("idle");

  const handleRun = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/executive-reporting/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "executive-reporting-run-page",
          sessionData: (() => {
            try {
              return {
                purposeAlignment: JSON.parse(sessionStorage.getItem("purpose-alignment-result") || "null"),
                teamAssessment: JSON.parse(sessionStorage.getItem("team-assessment-result") || "null"),
                enterpriseAssessment: JSON.parse(sessionStorage.getItem("enterprise-assessment-result") || "null"),
              };
            } catch {
              return {};
            }
          })(),
        }),
      });
      const data = await res.json();
      if (data?.ok) {
        sessionStorage.setItem("executive-report-result", JSON.stringify(data));
        setStatus("complete");
      }
    } catch {
      setStatus("idle");
    }
  };

  return (
    <Layout title="Run Executive Report" description="Generate your board-grade executive intelligence brief.">
      <section className="relative py-20 lg:py-28">
        <div className="mx-auto max-w-3xl px-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-white/40 mb-12">
            <Link href="/diagnostics" className="hover:text-white/60 transition-colors">Diagnostics</Link>
            <span>/</span>
            <Link href="/diagnostics/executive-reporting" className="hover:text-white/60 transition-colors">Executive Reporting</Link>
            <span>/</span>
            <span className="text-white/60">Run</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-8"
          >
            <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-white/30">
              Executive Intelligence Brief
            </span>
            <h1 className="font-serif text-4xl lg:text-5xl text-white/90 leading-tight">
              Generate Your Report
            </h1>
            <p className="text-sm leading-[1.8] text-white/45 max-w-xl mx-auto">
              This will compile all available diagnostic signal — purpose alignment, team assessment,
              enterprise assessment — into a single board-grade executive intelligence brief.
            </p>

            {status === "idle" && (
              <motion.button
                onClick={handleRun}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.08] px-8 py-4 font-mono text-[9px] uppercase tracking-[0.2em] text-amber-300 hover:bg-amber-500/[0.15] transition-colors"
              >
                Generate Executive Report
              </motion.button>
            )}

            {status === "loading" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <Loader2 className="h-6 w-6 text-amber-500/60 animate-spin" />
                <p className="font-mono text-[9px] text-white/30 uppercase tracking-widest">
                  Compiling executive intelligence...
                </p>
              </motion.div>
            )}

            {status === "complete" && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-8 space-y-4"
              >
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-emerald-400/70">
                  Report Generated
                </p>
                <p className="text-sm text-white/50">
                  Your executive intelligence brief is ready. View it in the boardroom surface or download as PDF.
                </p>
                <div className="flex items-center justify-center gap-4 pt-2">
                  <Link
                    href="/diagnostics/executive-reporting"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] px-6 py-3 font-mono text-[9px] uppercase tracking-[0.2em] text-white/50 hover:text-white/80 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </Link>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
