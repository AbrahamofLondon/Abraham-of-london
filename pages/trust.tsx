/**
 * pages/trust.tsx
 *
 * /trust — Public Trust Center
 *
 * Security posture, data handling, provenance boundary, certifications
 * (with honest status), sub-processors, responsible disclosure, and
 * data rights.
 *
 * Mandatory: do not claim SOC2, ISO, WORM, blockchain anchoring, or
 * third-party audit unless evidence exists. Every claim here is accurate
 * at time of writing.
 */

import type { CSSProperties } from "react";
import type { NextPage } from "next";
import Link from "next/link";
import {
  Shield,
  Lock,
  Database,
  Hash,
  Server,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Mail,
  ArrowRight,
  ExternalLink,
  FileText,
  Users,
} from "lucide-react";
import Layout from "@/components/Layout";
import LegalIdentityBlock from "@/components/trust/LegalIdentityBlock";
import SecurityAssuranceStatusStrip from "@/components/trust/SecurityAssuranceStatusStrip";
import TrustInfoRow from "@/components/trust/TrustInfoRow";
import PlainEnglishDecisionLayer from "@/components/trust/PlainEnglishDecisionLayer";
import WorkedDecisionExample from "@/components/trust/WorkedDecisionExample";

const GOLD = "#C9A96E";

const mono: CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
};

const serif: CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, Cambria, 'Times New Roman', serif",
  fontWeight: 300,
};

// ─── Certification status component ─────────────────────────────────────────

type CertStatus = "LIVE" | "PLANNED" | "IN_PROGRESS" | "NOT_STARTED" | "ARCHITECTED";

function CertBadge({ status }: { status: CertStatus }) {
  const map: Record<CertStatus, { label: string; color: string }> = {
    LIVE: { label: "Live", color: "rgba(100,220,140,0.85)" },
    PLANNED: { label: "Planned", color: `${GOLD}BB` },
    IN_PROGRESS: { label: "In progress", color: `${GOLD}88` },
    NOT_STARTED: { label: "Not yet", color: "rgba(255,255,255,0.28)" },
    ARCHITECTED: { label: "Architected, not live", color: `${GOLD}66` },
  };
  const { label, color } = map[status];
  return (
    <span
      style={{
        ...mono,
        fontSize: "6.5px",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color,
        border: `1px solid ${color}33`,
        padding: "0.15rem 0.4rem",
      }}
    >
      {label}
    </span>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

const TrustPage: NextPage = () => (
  <Layout
    title="Trust Center | Abraham of London"
    description="Security posture, data handling, provenance boundary, certifications, sub-processors, responsible disclosure, and your data rights."
    canonicalUrl="/trust"
  >
    <main
      className="min-h-screen py-20"
      style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}
    >
      <div className="mx-auto max-w-3xl space-y-10">

        {/* ── HEADER ──────────────────────────────────────────────── */}
        <header style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "2rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              border: `1px solid ${GOLD}30`,
              backgroundColor: `${GOLD}08`,
              color: `${GOLD}BB`,
              ...mono,
              fontSize: "7px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              padding: "0.25rem 0.55rem",
              marginBottom: "1rem",
            }}
          >
            Trust Center
          </div>

          <div className="flex items-center gap-3 mb-3">
            <Shield className="h-6 w-6" style={{ color: GOLD }} />
            <h1
              style={{
                ...serif,
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                lineHeight: 1.1,
                color: "rgba(255,255,255,0.92)",
              }}
            >
              Security and Trust
            </h1>
          </div>

          <p
            style={{
              ...serif,
              fontSize: "1rem",
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.60)",
              maxWidth: "55ch",
            }}
          >
            An honest account of our current security posture, what we store,
            how provenance integrity works, and what rights you hold over your
            data. No certifications are claimed that we do not hold.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/diagnostics/fast"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                border: `1px solid ${GOLD}44`,
                backgroundColor: `${GOLD}0A`,
                color: `${GOLD}CC`,
                ...mono,
                fontSize: "8px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                padding: "0.65rem 1.1rem",
                textDecoration: "none",
              }}
            >
              Create your governed case
              <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              href="/pricing"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                border: "1px solid rgba(255,255,255,0.10)",
                backgroundColor: "rgba(255,255,255,0.02)",
                color: "rgba(255,255,255,0.4)",
                ...mono,
                fontSize: "8px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                padding: "0.65rem 1.1rem",
                textDecoration: "none",
              }}
            >
              View Professional continuity
            </Link>
          </div>
        </header>

        <LegalIdentityBlock />

        <SecurityAssuranceStatusStrip />

        <section
          style={{
            border: `1px solid ${GOLD}18`,
            backgroundColor: `${GOLD}04`,
            padding: "1rem",
          }}
        >
          <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}88`, marginBottom: "0.65rem" }}>
            Security assurance readiness
          </p>
          <p className="max-w-2xl text-[15px] leading-7 text-white/60">
            Independent SOC 2, ISO 27001 certification, and external penetration testing are not yet complete. The current assurance posture is documented through legal identity, infrastructure disclosure, sub-processor visibility, pilot data boundaries, incident-response posture, and provenance / auditability controls.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/security-review"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: `${GOLD}99`,
                textDecoration: "none",
                border: `1px solid ${GOLD}22`,
                padding: "0.4rem 0.8rem",
              }}
            >
              Review security assurance materials
              <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              href="/security-review#request-security-assurance-pack"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.45)",
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "0.4rem 0.8rem",
              }}
            >
              Request assurance pack
            </Link>
          </div>
        </section>

        {/* ── PLAIN-ENGLISH LAYER ─────────────────────────────────── */}
        <PlainEnglishDecisionLayer id="plain-english-trust" />

        {/* ── SECURITY POSTURE ────────────────────────────────────── */}
        <Section icon={<Lock className="h-4 w-4" />} heading="Security posture">
          <Row label="Hosting" value="Netlify (CDN) + serverless functions. TLS 1.2+ enforced. No unencrypted HTTP." />
          <Row label="Authentication" value="Managed via NextAuth.js. Session tokens are short-lived. Magic link and OAuth supported." />
          <Row label="MFA / SSO" value="Enterprise SSO and enforced organisation-level MFA are not yet represented as generally available. Availability can be reviewed for qualified enterprise deployments." />
          <Row label="Administrative access" value="Administrative access is limited to authorised operator/admin roles for support, review, delivery, and security operations. Certain provenance and admin operations are logged for review." />
          <Row label="Database" value="PostgreSQL via Prisma ORM. Parameterised queries throughout. No raw SQL strings in user-facing paths." />
          <Row label="Secrets management" value="Environment variables via Netlify. No secrets in source control. No plaintext keys in logs." />
          <Row label="Dependency scanning" value="pnpm audit on every install. Dependabot alerts enabled." />
          <Row label="Rate limiting" value="Applied to all public API endpoints. IP-level limits enforced server-side." />
          <Row label="Error handling" value="Internal errors are logged server-side. Stack traces are never returned to clients." />
        </Section>

        {/* ── DATA HANDLING ───────────────────────────────────────── */}
        <Section icon={<Database className="h-4 w-4" />} heading="Data handling">
          <Row label="What we store" value="Governed case records, assessment results, session data, and authentication credentials. No financial data is processed or stored directly." />
          <Row label="What we do not store" value="Raw payment card data. Your evidence content is stored as you submit it — we do not process it for any purpose beyond the product features you use." />
          <Row label="Data location" value="Default infrastructure may involve UK/EU/US provider regions depending on the service used. Region-specific deployment, data residency commitments, and transfer terms must be agreed during enterprise procurement or contract review; no blanket residency guarantee is represented for all accounts." />
          <Row label="Retention" value="Active cases are retained while your account is active. Deleted cases are soft-deleted and permanently purged after 30 days." />
          <Row label="Third-party access" value="Sub-processors listed below. No sale of personal data. No data sharing for advertising. DPA and sub-processor review can be handled through the security assurance request process." />
          <Row label="Analytics and telemetry" value="Product analytics may be used to understand usage, reliability, and product improvement. Specific telemetry fields and account-level restrictions can be reviewed through the security assurance process." />
          <Row label="Encryption at rest" value="Database encryption managed by hosting provider. Application-level field encryption applied to sensitive governance fields." />
          <Row label="Backups" value="Daily automated backups are retained for 7 days. This is not a contractual RTO/RPO commitment; restore-testing posture and available evidence can be discussed through the security assurance process." />
        </Section>

        {/* ── PROVENANCE BOUNDARY ─────────────────────────────────── */}
        <Section icon={<Hash className="h-4 w-4" />} heading="Provenance boundary">
          <p style={{ ...serif, fontSize: "0.95rem", lineHeight: 1.7, color: "rgba(255,255,255,0.60)", marginBottom: "0.75rem" }}>
            The provenance system computes and stores SHA-256 hashes of canonical
            case records. This creates structural tamper-evidence — if a record
            changes after sealing, its hash no longer matches. Verification is
            performed on demand; results are not cached.
          </p>

          {/* ── Terms used here ── */}
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.06)",
              backgroundColor: "rgba(255,255,255,0.01)",
              padding: "0.75rem 1rem",
              marginBottom: "1rem",
            }}
          >
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}70`, marginBottom: "0.6rem" }}>
              Terms used here
            </p>
            <dl className="grid gap-2 sm:grid-cols-2">
              {([
                { term: "Sealing", def: "Finalising a record and computing its hash, closing it against undetected modification." },
                { term: "Tamper-evidence", def: "If any field changes after sealing, the hash no longer matches — changes become detectable." },
                { term: "Hash", def: "A unique fingerprint of a record's content. Any change produces a different fingerprint." },
                { term: "Anchoring", def: "Publishing the hash to an external immutable log so verification does not depend solely on internal records." },
              ] as const).map(({ term, def }) => (
                <div key={term}>
                  <dt style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: `${GOLD}BB`, marginBottom: "2px" }}>
                    {term}
                  </dt>
                  <dd style={{ ...serif, fontSize: "0.85rem", lineHeight: 1.6, color: "rgba(255,255,255,0.60)" }}>
                    {def}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="space-y-3 mt-2">
            <CertRow label="Internal chain anchoring" status="LIVE" note="Hash computed and stored for supported governed records at time of sealing." />
            <CertRow label="External WORM anchoring" status="ARCHITECTED" note="Architecture designed. Not yet connected to an external immutable log. No blockchain or public ledger claims are made." />
            <CertRow label="Client-facing hash verification" status="LIVE" note="Authenticated users can verify supported records via /api/provenance/verify-case." />
            <CertRow label="Public demo verification" status="LIVE" note="Anyone can verify the canonical demo record at /provenance/demo." />
          </div>
        </Section>

        {/* ── CERTIFICATIONS ──────────────────────────────────────── */}
        <Section icon={<FileText className="h-4 w-4" />} heading="Certifications and compliance">
          <p style={{ ...serif, fontSize: "0.9rem", lineHeight: 1.6, color: "rgba(255,200,80,0.7)", marginBottom: "0.75rem", borderLeft: `2px solid rgba(255,200,80,0.3)`, paddingLeft: "0.75rem" }}>
            We state exactly what we hold and what we do not. No certifications
            are implied beyond what is listed here.
          </p>

          {/* ── Company / platform certifications ── */}
          <div className="mb-6">
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}88`, marginBottom: "0.75rem" }}>
              Company / platform certifications
            </p>
            <div className="space-y-3">
              <CertRow label="SOC 2 Type I" status="PLANNED" note="Not yet held. Planned as part of enterprise readiness programme." />
              <CertRow label="SOC 2 Type II" status="NOT_STARTED" note="Not yet held. Follows SOC 2 Type I. No timeline committed publicly." />
              <CertRow label="ISO/IEC 27001 organisational certification" status="NOT_STARTED" note="Not yet held." />
              <CertRow label="Independent security audit" status="PLANNED" note="Planned before enterprise GA. Specific firm not yet engaged." />
              <CertRow label="GDPR compliance programme" status="IN_PROGRESS" note="Data rights fulfilment (deletion, export) implemented. DPA available on request for enterprise accounts." />
              <CertRow label="CCPA compliance" status="IN_PROGRESS" note="Data rights implemented. Privacy policy covers CCPA requirements." />
            </div>
          </div>

          {/* ── Founder / operator assurance credentials ── */}
          <div>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}88`, marginBottom: "0.75rem" }}>
              Founder assurance credentials
            </p>
            <p style={{ ...serif, fontSize: "0.9rem", lineHeight: 1.65, color: "rgba(255,255,255,0.60)", marginBottom: "0.75rem" }}>
              Abraham Adaramola holds an ISO/IEC 27001:2022 Lead Auditor credential and has formal training across consulting management, company direction, cybersecurity, business development, and MBA-level brand leadership.
            </p>
            <p style={{ ...serif, fontSize: "0.82rem", lineHeight: 1.6, color: "rgba(255,255,255,0.45)", fontStyle: "italic", marginBottom: "1rem", borderLeft: `1px solid ${GOLD}33`, paddingLeft: "0.75rem" }}>
              These credentials support assurance literacy, audit awareness, and governance discipline. They should not be read as independent certification of Alomarada Ltd, Abraham of London, or the platform.
            </p>
            <a
              href="https://www.linkedin.com/in/abraham-adaramola-06630321/"
              target="_blank"
              rel="noopener noreferrer"
              className="mb-4 inline-flex items-center gap-1"
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: `${GOLD}99`,
                textDecoration: "none",
              }}
            >
              View founder profile on LinkedIn
              <ExternalLink className="h-3 w-3" />
            </a>
            <div className="space-y-3">
              <CertRow
                label="ISO/IEC 27001:2022 Lead Auditor"
                status="LIVE"
                note="Abraham Adaramola — Mastermind Assurance"
              />
              <CertRow label="Level 7 Diploma in Consulting Management" status="LIVE" note="Chartered Management Institute, 2017" />
              <CertRow label="MBA, Brand Leadership" status="LIVE" note="University of East Anglia, 2017" />
              <CertRow label="Cybersecurity training" status="LIVE" note="Formal cybersecurity training supporting assurance literacy." />
            </div>
          </div>
        </Section>

        {/* ── SUB-PROCESSORS ──────────────────────────────────────── */}
        <Section icon={<Server className="h-4 w-4" />} heading="Sub-processors">
          <div className="space-y-2">
            {[
              { name: "Netlify", purpose: "Hosting, CDN, serverless functions", region: "US/EU" },
              { name: "Neon / PostgreSQL", purpose: "Primary database", region: "EU" },
              { name: "Upstash Redis", purpose: "Rate limiting, session caching", region: "EU" },
              { name: "Resend", purpose: "Transactional email (magic links, notifications)", region: "US" },
              { name: "Stripe", purpose: "Payment processing (where applicable)", region: "US/EU" },
              { name: "Vercel Analytics / PostHog", purpose: "Anonymised product analytics", region: "EU" },
            ].map(({ name, purpose, region }) => (
              <div key={name} className="border border-white/[0.05] px-3">
                <TrustInfoRow label={name} meta={region}>
                  {purpose}
                </TrustInfoRow>
              </div>
            ))}
          </div>
        </Section>

        {/* ── UPTIME / STATUS ─────────────────────────────────────── */}
        <Section icon={<Clock className="h-4 w-4" />} heading="Uptime and status">
          <Row label="Status page" value="A public status page is not yet published. Internal/system health checks exist, but they should not be read as a public status history or uptime SLA." />
          <Row label="Incident notification" value="Material incidents are notified via email to affected accounts. For current pilots, incident communication expectations should be agreed within the engagement scope." />
          <Row label="Target uptime" value="99.5% monthly operating target. This is not represented as a guaranteed uptime SLA unless separately agreed in contract." />
          <Row label="Planned maintenance" value="Notified by email where downtime exceeds 5 minutes." />
        </Section>

        {/* ── RESPONSIBLE DISCLOSURE ──────────────────────────────── */}
        <Section icon={<AlertTriangle className="h-4 w-4" />} heading="Responsible disclosure">
          <p style={{ ...serif, fontSize: "0.95rem", lineHeight: 1.7, color: "rgba(255,255,255,0.60)", marginBottom: "0.75rem" }}>
            If you discover a security vulnerability, please report it privately.
            We commit to acknowledging receipt within 2 business days and
            communicating a remediation plan within 10 business days.
          </p>
          <Row label="Report to" value="security@abrahamoflondon.com" />
          <Row label="Scope" value="Authentication, provenance integrity, data exposure, privilege escalation." />
          <Row label="Out of scope" value="Rate limiting bypasses for non-sensitive endpoints, UI cosmetic issues, SPF/DKIM configuration." />
          <Row label="Bug bounty" value="No formal bounty programme at this stage. Responsible researchers are credited where they consent." />

          <div style={{ marginTop: "1rem" }}>
            <Link
              href="/security-review"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: `${GOLD}99`,
                textDecoration: "none",
                border: `1px solid ${GOLD}22`,
                padding: "0.4rem 0.8rem",
              }}
            >
              Request a security review pack
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </Section>

        {/* ── YOUR RIGHTS ─────────────────────────────────────────── */}
        <Section icon={<Users className="h-4 w-4" />} heading="Your rights">
          <p style={{ ...serif, fontSize: "0.9rem", lineHeight: 1.6, color: "rgba(255,255,255,0.60)", marginBottom: "0.75rem" }}>
            Only rights that are implemented are listed here.
          </p>

          <div className="space-y-3">
            <RightRow
              title="Right to deletion"
              status="LIVE"
              description="You may delete any governed case you own from Decision Centre. Deletion is permanent after a 30-day grace period. API: DELETE /api/cases/[caseId]."
            />
            <RightRow
              title="Right to export"
              status="LIVE"
              description="You may export all your personal data in JSON format from Decision Centre or account settings. Export excludes raw internal governance fields. API: GET /api/user/data-export."
            />
            <RightRow
              title="Right to rectification"
              status="LIVE"
              description="You can correct case metadata (case name, status) through Decision Centre. Assessment results themselves are immutable — their integrity depends on immutability."
            />
            <RightRow
              title="Right to restriction"
              status="LIVE"
              description="The system does not use personal data for automated decision-making beyond the explicit governance features you opt into. No profiling for advertising or third-party scoring."
            />
            <RightRow
              title="Right to portability"
              status="IN_PROGRESS"
              description="Covered by the data export function. Machine-readable JSON. Structured export format under review."
            />
          </div>

          <p
            style={{
              marginTop: "1rem",
              ...serif,
              fontSize: "0.85rem",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.45)",
              fontStyle: "italic",
            }}
          >
            To exercise any right or to request a Data Processing Agreement,
            contact{" "}
            <a
              href="mailto:privacy@abrahamoflondon.com"
              style={{ color: `${GOLD}88`, textDecoration: "none" }}
            >
              privacy@abrahamoflondon.com
            </a>
            .
          </p>
        </Section>

        {/* ── WORKED EXAMPLE ─────────────────────────────────────── */}
        <WorkedDecisionExample id="worked-example-trust" />

        {/* ── CONTACT ─────────────────────────────────────────────── */}
        <section
          style={{
            border: `1px solid ${GOLD}18`,
            backgroundColor: `${GOLD}04`,
            padding: "1.25rem",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Mail className="h-4 w-4" style={{ color: `${GOLD}70` }} />
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}88` }}>
              Contact for security review
            </p>
          </div>

          <p style={{ ...serif, fontSize: "0.95rem", lineHeight: 1.65, color: "rgba(255,255,255,0.60)", marginBottom: "1rem" }}>
            Enterprise and procurement enquiries requiring a security review pack,
            DPA, or detailed architecture briefing should use the link below.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/security-review"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                border: `1px solid ${GOLD}44`,
                backgroundColor: `${GOLD}0A`,
                color: `${GOLD}CC`,
                ...mono,
                fontSize: "8px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                padding: "0.65rem 1.1rem",
                textDecoration: "none",
              }}
            >
              Request security review
              <ArrowRight className="h-3 w-3" />
            </Link>

            <a
              href="mailto:security@abrahamoflondon.com"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                border: "1px solid rgba(255,255,255,0.10)",
                backgroundColor: "rgba(255,255,255,0.02)",
                color: "rgba(255,255,255,0.4)",
                ...mono,
                fontSize: "8px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                padding: "0.65rem 1.1rem",
                textDecoration: "none",
              }}
            >
              security@abrahamoflondon.com
            </a>
          </div>
        </section>

        {/* ── CROSS-LINKS ─────────────────────────────────────────── */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1.5rem" }}>
          <p style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)", marginBottom: "0.75rem" }}>
            Related
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Provenance demo", href: "/provenance/demo" },
              { label: "Provenance explained", href: "/provenance/explained" },
              { label: "Privacy policy", href: "/privacy" },
              { label: "Security policy", href: "/security" },
              { label: "Anchor log", href: "/provenance/anchor-log" },
              { label: "Explore Library", href: "/library" },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.28)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  padding: "0.3rem 0.6rem",
                  textDecoration: "none",
                }}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* ── Legal disclaimer ── */}
          <p
            className="mt-12 max-w-3xl"
            style={{
              ...mono,
              fontSize: "6.5px",
              lineHeight: 1.8,
              letterSpacing: "0.1em",
              color: "rgba(255,255,255,0.18)",
            }}
          >
            Abraham of London provides governed decision instruments and structured advisory frameworks.
            Nothing on this page constitutes legal, financial, investment, tax, medical, immigration,
            accounting, or other regulated professional advice. Access fees, where applicable, are charged
            for methodology access, software-enabled records, structured outputs, and session facilitation,
            not for guaranteed outcomes.
          </p>
        </div>
      </div>
    </main>
  </Layout>
);

// ─── Sub-components ──────────────────────────────────────────────────────────

function Section({
  icon,
  heading,
  children,
}: {
  icon: React.ReactNode;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="scroll-mt-28 space-y-4">
      <div className="flex items-center gap-2">
        <span style={{ color: `${GOLD}70` }}>{icon}</span>
        <h2
          style={{
            ...serif,
            fontSize: "clamp(1.1rem, 2vw, 1.4rem)",
            color: "rgba(255,255,255,0.85)",
            lineHeight: 1.2,
          }}
        >
          {heading}
        </h2>
      </div>
      <div className="space-y-2 pl-1">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <TrustInfoRow label={label}>{value}</TrustInfoRow>;
}

function CertRow({
  label,
  status,
  note,
}: {
  label: string;
  status: CertStatus;
  note: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.25rem",
        padding: "0.65rem 0.75rem",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex items-center gap-2">
        <p
          style={{
            ...serif,
            fontSize: "0.9rem",
            color: "rgba(255,255,255,0.72)",
            flex: 1,
          }}
        >
          {label}
        </p>
        <CertBadge status={status} />
      </div>
      <p
        style={{
          ...serif,
          fontSize: "0.82rem",
          lineHeight: 1.55,
          color: "rgba(255,255,255,0.45)",
        }}
      >
        {note}
      </p>
    </div>
  );
}

function RightRow({
  title,
  status,
  description,
}: {
  title: string;
  status: CertStatus;
  description: string;
}) {
  return (
    <div
      style={{
        padding: "0.75rem",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        {status === "LIVE" ? (
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: "rgba(100,220,140,0.7)" }} />
        ) : (
          <Clock className="h-3.5 w-3.5 shrink-0" style={{ color: `${GOLD}66` }} />
        )}
        <p style={{ ...serif, fontSize: "0.95rem", color: "rgba(255,255,255,0.78)" }}>
          {title}
        </p>
        <CertBadge status={status} />
      </div>
      <p
        style={{
          ...serif,
          fontSize: "0.85rem",
          lineHeight: 1.6,
          color: "rgba(255,255,255,0.60)",
          paddingLeft: "1.5rem",
        }}
      >
        {description}
      </p>
    </div>
  );
}

export default TrustPage;
