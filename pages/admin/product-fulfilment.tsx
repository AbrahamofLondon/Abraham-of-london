/**
 * pages/admin/product-fulfilment.tsx
 *
 * Admin product fulfilment matrix.
 * Shows readiness status (GREEN/AMBER/RED/GREY) for every product in the estate.
 */

import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { PRODUCT_FULFILMENT_CONTRACTS } from "@/lib/product/product-fulfilment-contract";
import { validateAllContracts } from "@/lib/product/fulfilment-readiness-validator";
import type { EstateReadinessReport, ProductReadinessResult } from "@/lib/product/fulfilment-readiness-validator";

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  report: EstateReadinessReport;
};

// ── Badge ─────────────────────────────────────────────────────────────────────

function ReadinessBadge({ status }: { status: ProductReadinessResult["computedStatus"] }) {
  const configs = {
    sellable: { label: "SELLABLE", bg: "bg-green-100", text: "text-green-800", border: "border-green-300" },
    proof_ready: { label: "PROOF READY", bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-300" },
    not_sellable: { label: "NOT SELLABLE", bg: "bg-red-100", text: "text-red-800", border: "border-red-300" },
    not_applicable: { label: "N/A", bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-200" },
  };
  const c = configs[status];
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-mono font-semibold rounded border ${c.bg} ${c.text} ${c.border}`}>
      {c.label}
    </span>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────

function ProductRow({ result }: { result: ProductReadinessResult }) {
  const hasHardFailures = result.hardFailures.length > 0;
  const hasWarnings = result.warnings.length > 0 || result.contractWarnings.length > 0;

  return (
    <tr className={`border-b border-gray-100 ${hasHardFailures ? "bg-red-50/30" : ""}`}>
      <td className="py-2 px-3 font-mono text-xs text-gray-800">{result.productCode}</td>
      <td className="py-2 px-3 text-sm text-gray-700">{result.displayName}</td>
      <td className="py-2 px-3 text-xs text-gray-500 font-mono">{result.fulfilmentType}</td>
      <td className="py-2 px-3">
        <ReadinessBadge status={result.computedStatus} />
        {result.statusMismatch && (
          <span className="ml-1 text-xs text-orange-600 font-mono">
            (declared: {result.declaredStatus})
          </span>
        )}
      </td>
      <td className="py-2 px-3">
        {hasHardFailures && (
          <ul className="space-y-0.5">
            {result.hardFailures.map((f) => (
              <li key={f.rule} className="text-xs text-red-700">
                <span className="font-mono text-red-400">[{f.rule}]</span> {f.message}
              </li>
            ))}
          </ul>
        )}
        {hasWarnings && (
          <ul className="space-y-0.5 mt-0.5">
            {[...result.warnings, ...result.contractWarnings.map((w) => ({ rule: "CONTRACT", message: w }))].map(
              (w, i) => (
                <li key={i} className="text-xs text-yellow-700">
                  <span className="font-mono text-yellow-500">[{w.rule}]</span> {w.message}
                </li>
              ),
            )}
          </ul>
        )}
        {!hasHardFailures && !hasWarnings && (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
    </tr>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProductFulfilmentPage({ report }: Props) {
  const sellableResults = report.results.filter((r) => r.computedStatus === "sellable");
  const proofReadyResults = report.results.filter((r) => r.computedStatus === "proof_ready");
  const notSellableResults = report.results.filter((r) => r.computedStatus === "not_sellable");
  const naResults = report.results.filter((r) => r.computedStatus === "not_applicable");

  return (
    <>
      <Head>
        <title>Product Fulfilment Matrix — Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <Link href="/admin" className="hover:text-gray-600">Admin</Link>
              <span>/</span>
              <span>Product Fulfilment Matrix</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Product Fulfilment Matrix</h1>
            <p className="text-sm text-gray-500 mt-1">
              Readiness status for every product in the estate.
              Generated at {new Date(report.generatedAt).toLocaleString("en-GB")}.
            </p>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Sellable", count: report.sellable, color: "bg-green-50 border-green-200 text-green-800" },
              { label: "Proof Ready", count: report.proofReady, color: "bg-yellow-50 border-yellow-200 text-yellow-800" },
              { label: "Not Sellable", count: report.notSellable, color: "bg-red-50 border-red-300 text-red-800" },
              { label: "N/A", count: report.notApplicable, color: "bg-gray-50 border-gray-200 text-gray-600" },
            ].map(({ label, count, color }) => (
              <div key={label} className={`rounded border px-4 py-3 ${color}`}>
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-xs font-medium mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Blocked alert */}
          {report.blocked > 0 && (
            <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
              <strong>🔴 {report.blocked} product(s) blocked from sale.</strong>{" "}
              Fix hard failures before enabling checkout for these products.
            </div>
          )}

          {/* Mismatch alert */}
          {report.statusMismatches > 0 && (
            <div className="mb-4 rounded border border-orange-300 bg-orange-50 px-4 py-3 text-sm text-orange-800">
              <strong>⚠️ {report.statusMismatches} declared status mismatch(es).</strong>{" "}
              Contract declared status does not match computed status. Update the contract.
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className="py-2 px-3 font-semibold text-gray-600 text-xs">Product Code</th>
                  <th className="py-2 px-3 font-semibold text-gray-600 text-xs">Name</th>
                  <th className="py-2 px-3 font-semibold text-gray-600 text-xs">Fulfilment Type</th>
                  <th className="py-2 px-3 font-semibold text-gray-600 text-xs">Status</th>
                  <th className="py-2 px-3 font-semibold text-gray-600 text-xs">Issues</th>
                </tr>
              </thead>
              <tbody>
                {/* Blocked first */}
                {notSellableResults.map((r) => (
                  <ProductRow key={r.productCode} result={r} />
                ))}
                {/* Then proof-ready */}
                {proofReadyResults.map((r) => (
                  <ProductRow key={r.productCode} result={r} />
                ))}
                {/* Then sellable */}
                {sellableResults.map((r) => (
                  <ProductRow key={r.productCode} result={r} />
                ))}
                {/* N/A at bottom */}
                {naResults.map((r) => (
                  <ProductRow key={r.productCode} result={r} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="mt-4 text-xs text-gray-400 space-y-1">
            <p>
              Source of truth:{" "}
              <code className="font-mono">lib/product/product-fulfilment-contract.ts</code>
            </p>
            <p>
              Validator:{" "}
              <code className="font-mono">lib/product/fulfilment-readiness-validator.ts</code>
            </p>
            <p>
              Build gate:{" "}
              <code className="font-mono">node scripts/check-product-fulfilment-readiness.mjs</code>
            </p>
            <p className="mt-2 text-gray-500">
              <strong>PRODUCT FREEZE RULE:</strong> No new product may be added to checkout without a
              contract entry and a passing build gate.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}

// ── SSR ───────────────────────────────────────────────────────────────────────

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    return { redirect: { destination: "/admin/login", permanent: false } };
  }

  const report = validateAllContracts(PRODUCT_FULFILMENT_CONTRACTS);

  return {
    props: { report: JSON.parse(JSON.stringify(report)) as EstateReadinessReport },
  };
};
