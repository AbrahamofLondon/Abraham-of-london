import * as React from "react";
import type { NextPage } from "next";
import InstrumentShell from "@/components/instruments/InstrumentShell";
import ExecutionRiskIndexRunner from "@/components/instruments/ExecutionRiskIndexRunner";
import { track } from "@/lib/analytics/track";
import type { ExecutionRiskResult } from "@/lib/instruments/execution-risk-index/engine";
import { buildInstrumentSignalAuthority } from "@/lib/product/instrument-signal-authority";
import { ProductAuthorityPanel } from "@/components/product/ProductAuthorityPanel";
import { ProductAuthorityNotice } from "@/components/product/ProductAuthorityNotice";
import { resolveProductAuthority, PUBLIC_NON_EXEMPT_PRODUCT_AUTHORITY_CONFIGS } from "@/lib/product/resolve-product-authority";

const ExecutionRiskRun: NextPage = () => {
  const [result, setResult] = React.useState<ExecutionRiskResult | null>(null);
  const [resultKey, setResultKey] = React.useState<string | null>(null);

  const config = PUBLIC_NON_EXEMPT_PRODUCT_AUTHORITY_CONFIGS.find(c => c.productCode === 'execution_risk_index');
  const contract = config ? resolveProductAuthority(config) : null;

  React.useEffect(() => { track("instrument_started", { instrumentSlug: "execution-risk-index" }); }, []);

  async function handleComplete(r: ExecutionRiskResult) {
    setResult(r);
    track("instrument_result_saved", { instrumentSlug: "execution-risk-index", decisionState: r.riskBand });
    try {
      const res = await fetch("/api/decision-instruments/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instrumentSlug: "execution-risk-index", version: r.version, scores: r.dimensionScores, result: r }),
      });
      const data = await res.json();
      if (data.runId) setResultKey(data.runId);
    } catch (err) { console.error("[instrument] Result persist failed:", err); }
  }

  const nextHref = resultKey
    ? `/diagnostics/executive-reporting?instrumentResultId=${encodeURIComponent(resultKey)}`
    : "/strategy-room";

  return (
    <InstrumentShell
      title="Execution Risk Index"
      slug="execution-risk-index"
      completed={!!result}
      pdfHref={resultKey ? `/api/downloads/instrument-pdf?slug=execution-risk-index&runId=${encodeURIComponent(resultKey)}` : undefined}
      nextStepLabel={result?.riskBand === "CRITICAL" ? "Enter Strategy Room" : "Analyse institutional consequence"}
      nextStepHref={result?.riskBand === "CRITICAL" ? "/strategy-room" : nextHref}
      signalAuthority={result ? buildInstrumentSignalAuthority("execution-risk-index", result.riskIndex, result.riskBand, result.recommendation) : undefined}
      valueReceipt={result ? [
        { label: "Classification", value: `${result.riskBand} — ${result.riskIndex}/100` },
        { label: "Decay projection", value: result.decayProjection },
        { label: "Next admissible move", value: result.recommendation },
        { label: "Memory entry", value: "Saved to governed memory" },
        { label: "Dossier", value: "PDF dossier available" },
      ] : undefined}
    >
      {!result && contract && (
        <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', padding: '1rem', marginBottom: '1.5rem', borderRadius: '0.5rem' }}>
          <ProductAuthorityPanel contract={contract} />
          <div style={{ marginTop: '0.75rem' }}>
            <ProductAuthorityNotice contract={contract} />
          </div>
        </div>
      )}
      {!result ? (
        <ExecutionRiskIndexRunner onComplete={handleComplete} />
      ) : (
        <div className="space-y-4">
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "2rem", fontWeight: 300, color: result.riskBand === "CRITICAL" ? "rgba(252,165,165,0.80)" : "#C9A96ECC" }}>
            Risk Index: {result.riskIndex}/100 — {result.riskBand}
          </div>
          <p style={{ fontSize: "0.92rem", lineHeight: 1.7, color: "rgba(255,255,255,0.55)" }}>{result.recommendation}</p>
          <p style={{ fontSize: "0.82rem", lineHeight: 1.6, color: "rgba(255,255,255,0.35)" }}>{result.decayProjection}</p>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", color: "rgba(255,255,255,0.15)" }}>Result saved. Governed. v{result.version}</p>
        </div>
      )}
    </InstrumentShell>
  );
};

export default ExecutionRiskRun;
