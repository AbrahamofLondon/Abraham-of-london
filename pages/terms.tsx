// pages/terms-of-service.tsx
import * as React from "react";
import Layout from "@/components/Layout";
import PolicyFooter from "@/components/PolicyFooter";

export default function TermsOfServicePage(): JSX.Element {
  return (
    <Layout title="Terms of Service">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-4 font-serif text-3xl font-semibold text-cream">
          Terms of Service
        </h1>
        <p className="mb-6 text-sm text-gold/70">
          Last updated: {new Date().getFullYear()}
        </p>

        <p className="mb-4 text-sm leading-relaxed text-gray-200">
          These Terms of Service govern your use of this site and any resources,
          downloads, or services made available through it. By accessing or
          using the site, you agree to be bound by these terms.
        </p>

        <p className="mb-4 text-sm leading-relaxed text-gray-200">
          Nothing on this site constitutes formal legal, financial, tax, or
          professional advice. Any decisions you make remain your own
          responsibility, and you should seek independent professional advice
          where appropriate.
        </p>

        <PolicyFooter isDark />
      </div>
    </Layout>
  );
}