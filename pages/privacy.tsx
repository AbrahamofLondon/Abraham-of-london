// pages/privacy-policy.tsx
import * as React from "react";
import Layout from "@/components/Layout";
import PolicyFooter from "@/components/PolicyFooter";

export default function PrivacyPolicyPage(): JSX.Element {
  return (
    <Layout title="Privacy Policy">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-4 font-serif text-3xl font-semibold text-cream">
          Privacy Policy
        </h1>
        <p className="mb-6 text-sm text-gold/70">
          Last updated: {new Date().getFullYear()}
        </p>

        <p className="mb-4 text-sm leading-relaxed text-gray-200">
          This Privacy Policy explains how we collect, use, and safeguard
          personal information when you visit this site, subscribe to updates,
          or contact us. It should be read alongside our Terms of Service,
          Cookie Policy, Security Policy, and Accessibility Statement.
        </p>

        <p className="mb-4 text-sm leading-relaxed text-gray-200">
          We process data lawfully, fairly, and transparently, and only retain
          information for as long as it is needed for the purposes for which it
          was collected or to meet legal and regulatory requirements.
        </p>

        <p className="mb-4 text-sm leading-relaxed text-gray-200">
          If you have any questions about how your data is handled, you can
          contact us using the details provided in the{" "}
          <strong>Policy Footer</strong> below.
        </p>

        <PolicyFooter isDark />
      </div>
    </Layout>
  );
}