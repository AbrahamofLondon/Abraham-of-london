// pages/cookie-policy.tsx
import * as React from "react";
import Layout from "@/components/Layout";
import PolicyFooter from "@/components/PolicyFooter";

export default function CookiePolicyPage(): JSX.Element {
  return (
    <Layout title="Cookie Policy">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-4 font-serif text-3xl font-semibold text-cream">
          Cookie Policy
        </h1>
        <p className="mb-6 text-sm text-gold/70">
          Last updated: {new Date().getFullYear()}
        </p>

        <p className="mb-4 text-sm leading-relaxed text-gray-200">
          This Cookie Policy explains how and why cookies and similar
          technologies are used on this site, and how you can manage your
          preferences.
        </p>

        <p className="mb-4 text-sm leading-relaxed text-gray-200">
          We use cookies to understand site usage, improve user experience, and
          support essential functionality. Where analytics or marketing cookies
          are used, they are only activated in line with applicable consent
          requirements.
        </p>

        <PolicyFooter isDark />
      </div>
    </Layout>
  );
}