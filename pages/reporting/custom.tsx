import Link from "next/link";
import Layout from "@/components/Layout";

export default function CustomReportingPage() {
  return (
    <Layout title="Reporting — Custom | Abraham of London" description="Scope-bound custom reporting inquiry and delivery path." canonicalUrl="/reporting/custom">
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Manual billing</p>
        <h1 className="mt-3 text-3xl font-semibold text-neutral-950">Reporting — Custom</h1>
        <p className="mt-5 text-base leading-7 text-neutral-700">
          Bespoke reporting is qualified, scoped, locked, validated against the accepted brief, reviewed, and delivered with scope-versioned proof. Self-serve checkout is not available for this product.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/contact?context=reporting-custom" className="border border-neutral-900 px-4 py-2 text-sm text-neutral-950">Request scope</Link>
          <Link href="/reporting" className="px-4 py-2 text-sm text-neutral-600">Monthly reporting</Link>
        </div>
      </main>
    </Layout>
  );
}
