// pages/security-policy.tsx
import * as React from "react";
import Layout from "@/components/Layout";
import PolicyFooter from "@/components/PolicyFooter";

export default function SecurityPolicyPage(): JSX.Element {
  return (
    <Layout title="Security Policy">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-4 font-serif text-3xl font-semibold text-cream">
          Security Policy
        </h1>
        <p className="mb-6 text-sm text-gold/70">
          Last updated: {new Date().getFullYear()}
        </p>

        <p className="mb-4 text-sm leading-relaxed text-gray-200">
          We take the security of this platform seriously. While no system is
          ever entirely risk-free, we apply reasonable technical and
          organisational measures to protect data and reduce unnecessary
          exposure.
        </p>

        <p className="mb-4 text-sm leading-relaxed text-gray-200">
          This page provides a high-level overview of our security posture. It
          is not an exhaustive technical specification and may evolve as the
          platform matures.
        </p>

        <PolicyFooter isDark />
      </div>
    </Layout>
  );
}