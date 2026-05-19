/**
 * /security/disclosure - Security Vulnerability Disclosure Policy
 */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { Shield } from "lucide-react";
import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

const SecurityDisclosurePage: NextPage = () => {
  return (
    <Layout
      title="Security Disclosure | Abraham of London"
      description="How to responsibly disclose security vulnerabilities in Abraham of London."
      canonicalUrl="/security/disclosure"
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <main className="min-h-screen px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center gap-2">
            <Shield className="h-4 w-4" style={{ color: `${GOLD}78` }} />
            <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}70` }}>
              Security - Disclosure
            </span>
          </div>

          <h1 style={{ ...serif, fontSize: "clamp(1.9rem, 4vw, 2.6rem)", lineHeight: 1.1, color: "rgba(255,255,255,0.92)" }}>
            Responsible Disclosure Policy
          </h1>

          <p className="mt-4 text-sm" style={{ color: "rgba(255,255,255,0.48)", lineHeight: 1.85 }}>
            Abraham of London takes the security of its platform and the privacy of its users seriously.
            We welcome responsible disclosure from security researchers and the wider community.
          </p>

          <section className="mt-10 space-y-4">
            <h2 style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}70` }}>
              How to Report
            </h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.50)", lineHeight: 1.8 }}>
              Email:{" "}
              <a href="mailto:support@abrahamoflondon.org" style={{ color: `${GOLD}CC` }}>
                support@abrahamoflondon.org
              </a>
            </p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.50)", lineHeight: 1.8 }}>
              Please include: a clear description of the vulnerability, steps to reproduce,
              potential impact on user data or functionality, and your contact details for follow-up.
            </p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.40)", lineHeight: 1.8 }}>
              Encrypted communication is available on request via PGP. Contact the email above to receive a public key.
            </p>
          </section>

          <section className="mt-10">
            <h2 style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}70` }}>
              Response Commitment
            </h2>
            <div className="mt-4 space-y-3">
              {([
                ["Acknowledgement", "Within 72 hours of receiving a valid report."],
                ["Initial assessment", "Within 7 days -- we will confirm scope and severity."],
                ["Fix timeline", "Severity-dependent. Critical issues are prioritised immediately."],
                ["Disclosure", "Coordinated with the reporter after a patch is deployed."],
              ] as [string, string][]).map(([label, detail]) => (
                <div key={label} style={{ borderLeft: `2px solid ${GOLD}30`, paddingLeft: "1rem" }}>
                  <span className="block text-xs" style={{ ...mono, color: `${GOLD}80`, letterSpacing: "0.08em" }}>{label}</span>
                  <p className="mt-0.5 text-sm" style={{ color: "rgba(255,255,255,0.44)", lineHeight: 1.7 }}>{detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <h2 style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}70` }}>
              Scope
            </h2>
            <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.50)", lineHeight: 1.8 }}>
              In scope: abrahamoflondon.com and all subdomains, authentication flows, API endpoints,
              governed case data, access control, and provenance chain integrity.
            </p>
            <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.40)", lineHeight: 1.8 }}>
              Out of scope: third-party services we do not control, social engineering, physical security,
              denial-of-service attacks, and automated scanner output without exploitability evidence.
            </p>
          </section>

          <section className="mt-10">
            <h2 style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}70` }}>
              Ground Rules
            </h2>
            <ul className="mt-3 space-y-2 text-sm" style={{ color: "rgba(255,255,255,0.42)", lineHeight: 1.75 }}>
              <li>Do not access, modify, or delete data that is not your own.</li>
              <li>Do not perform automated scanning at a volume that degrades service.</li>
              <li>Do not publicly disclose a vulnerability before reasonable remediation time.</li>
              <li>Do not use findings to extract data beyond minimal proof-of-concept.</li>
            </ul>
          </section>

          <section className="mt-10">
            <h2 style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}70` }}>
              Our Commitment to Reporters
            </h2>
            <ul className="mt-3 space-y-2 text-sm" style={{ color: "rgba(255,255,255,0.44)", lineHeight: 1.75 }}>
              <li>We will not take legal action against researchers acting in good faith within this policy.</li>
              <li>We will not share reporter identity without explicit permission.</li>
              <li>We will acknowledge researchers in our security changelog where they consent.</li>
            </ul>
          </section>

          <section className="mt-10" style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1.25rem" }}>
            <h2 style={{ ...mono, fontSize: "6px", letterSpacing: "0.20em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
              Posture Note
            </h2>
            <p className="mt-2 text-xs" style={{ color: "rgba(255,255,255,0.28)", lineHeight: 1.75 }}>
              Abraham of London does not claim SOC 2, ISO 27001, WORM, blockchain anchoring, independent
              audit certification, or regulatory approval unless supported by current verifiable evidence.
              Our security posture is described factually on this page.
            </p>
          </section>

          <div className="mt-10 flex flex-wrap gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1.5rem" }}>
            {[
              { label: "Security overview", href: "/security" },
              { label: "Trust Centre", href: "/trust" },
              { label: "Privacy policy", href: "/privacy" },
              { label: "Verification", href: "/verification" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{ ...mono, fontSize: "7px", letterSpacing: "0.10em", textTransform: "uppercase", padding: "5px 10px", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.28)" }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default SecurityDisclosurePage;
