// pages/accessibility-statement.tsx
import * as React from "react";
import Layout from "@/components/Layout";
import PolicyFooter from "@/components/PolicyFooter";

export default function AccessibilityStatementPage(): JSX.Element {
  return (
    <Layout title="Accessibility Statement">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-4 font-serif text-3xl font-semibold text-cream">
          Accessibility Statement
        </h1>
        <p className="mb-6 text-sm text-gold/70">
          Last updated: {new Date().getFullYear()}
        </p>

        <p className="mb-4 text-sm leading-relaxed text-gray-200">
          We are committed to making this site as accessible and usable as
          reasonably possible for all visitors, including those using assistive
          technologies.
        </p>

        <p className="mb-4 text-sm leading-relaxed text-gray-200">
          Accessibility is an ongoing process. If you encounter barriers when
          using this site, we invite you to contact us so we can review and, 
          where feasible, address the issue.
        </p>

        <PolicyFooter isDark />
      </div>
    </Layout>
  );
}