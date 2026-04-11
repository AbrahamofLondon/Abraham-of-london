// pages/diagnostics/constitutional-diagnostic.tsx
import * as React from "react";
import Head from "next/head";
import Layout from "@/components/Layout";
import ConstitutionalDiagnosticSuite from "@/components/assessments/ConstitutionalDiagnosticSuite";

export default function ConstitutionalDiagnosticPage() {
  return (
    <Layout
      title="Constitutional Diagnostic"
      description="A serious first gate for route, posture, authority, and escalation fitness."
      className="bg-black text-white"
    >
      <Head>
        <title>Constitutional Diagnostic | Abraham of London</title>
      </Head>
      <main className="min-h-screen bg-black text-white">
        <ConstitutionalDiagnosticSuite />
      </main>
    </Layout>
  );
}