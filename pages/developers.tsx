/**
 * pages/developers.tsx
 *
 * Enterprise API documentation — /developers
 *
 * Public reference page for the Abraham of London enterprise API (v1).
 * Documents authentication, available endpoints, request/response shapes,
 * and the governed case data model accessible via the API.
 *
 * Doctrinal constraints:
 * - No fake data or example responses that imply AI analysis occurred
 * - All examples use placeholder values, not real case IDs or keys
 * - Mandatory boundary note: API responses are not legal/financial advice
 */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";

// ─── Tokens ───────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};
const BG = "#0A0A0A";
const CODE_BG = "#111111";

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        ...mono,
        fontSize: "8px",
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.28)",
        marginBottom: "8px",
      }}
    >
      {children}
    </p>
  );
}

function GoldDivider() {
  return (
    <div
      style={{
        height: "1px",
        background: `linear-gradient(90deg, transparent 0%, ${GOLD}18 30%, ${GOLD}18 70%, transparent 100%)`,
        margin: "40px 0",
      }}
    />
  );
}

function CodeBlock({ children, language = "json" }: { children: string; language?: string }) {
  return (
    <pre
      style={{
        ...mono,
        fontSize: "11px",
        lineHeight: 1.7,
        color: "rgba(255,255,255,0.65)",
        background: CODE_BG,
        border: "1px solid rgba(255,255,255,0.06)",
        padding: "16px 20px",
        overflowX: "auto",
        margin: "12px 0",
        whiteSpace: "pre",
      }}
    >
      <code>{children}</code>
    </pre>
  );
}

function EndpointBadge({ method, path }: { method: string; path: string }) {
  const colors: Record<string, string> = {
    GET:    "rgba(100,200,120,0.15)",
    POST:   "rgba(100,140,255,0.15)",
    DELETE: "rgba(255,100,100,0.15)",
  };
  const textColors: Record<string, string> = {
    GET:    "#6CC880",
    POST:   "#6490FF",
    DELETE: "#FF6464",
  };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 14px",
        background: colors[method] ?? "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        marginBottom: "16px",
        flexWrap: "wrap",
      }}
    >
      <span
        style={{
          ...mono,
          fontSize: "9px",
          letterSpacing: "0.14em",
          color: textColors[method] ?? "rgba(255,255,255,0.60)",
          flexShrink: 0,
        }}
      >
        {method}
      </span>
      <span
        style={{
          ...mono,
          fontSize: "11px",
          color: "rgba(255,255,255,0.60)",
          wordBreak: "break-all",
        }}
      >
        {path}
      </span>
    </div>
  );
}

function FieldRow({ name, type, required, description }: {
  name: string;
  type: string;
  required: boolean;
  description: string;
}) {
  return (
    <tr>
      <td
        style={{
          ...mono,
          fontSize: "10px",
          color: `${GOLD}BB`,
          paddingRight: "16px",
          paddingTop: "8px",
          paddingBottom: "8px",
          verticalAlign: "top",
          whiteSpace: "nowrap",
        }}
      >
        {name}
        {required && (
          <span style={{ color: "rgba(255,100,100,0.80)", marginLeft: "4px" }}>*</span>
        )}
      </td>
      <td
        style={{
          ...mono,
          fontSize: "9px",
          color: "rgba(255,255,255,0.35)",
          paddingRight: "16px",
          paddingTop: "8px",
          paddingBottom: "8px",
          verticalAlign: "top",
          whiteSpace: "nowrap",
        }}
      >
        {type}
      </td>
      <td
        style={{
          ...mono,
          fontSize: "9px",
          color: "rgba(255,255,255,0.45)",
          paddingTop: "8px",
          paddingBottom: "8px",
          verticalAlign: "top",
          lineHeight: 1.6,
        }}
      >
        {description}
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DevelopersPage() {
  return (
    <>
      <Head>
        <title>Enterprise API — Abraham of London</title>
        <meta
          name="description"
          content="Enterprise API reference for Abraham of London governed case systems. Authentication, endpoints, and data model."
        />
      </Head>

      <div
        style={{
          background: BG,
          color: "rgba(255,255,255,0.85)",
          minHeight: "100vh",
          padding: "64px 24px 96px",
        }}
      >
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>

          {/* ── Header ───────────────────────────────────────────────── */}
          <header style={{ marginBottom: "48px" }}>
            <SectionLabel>Enterprise API — v1</SectionLabel>
            <h1
              style={{
                ...serif,
                fontSize: "clamp(26px, 4vw, 40px)",
                color: "rgba(255,255,255,0.90)",
                lineHeight: 1.2,
                marginTop: "8px",
                marginBottom: "16px",
              }}
            >
              Governed case API
            </h1>
            <p
              style={{
                ...serif,
                fontSize: "16px",
                color: "rgba(255,255,255,0.50)",
                lineHeight: 1.75,
                maxWidth: "520px",
              }}
            >
              The v1 enterprise API enables contracted organisations to create
              governed case intake records, retrieve case summaries, and read
              the provenance chain — programmatically. Access requires an
              enterprise API key, issued by agreement.
            </p>
          </header>

          {/* ── Boundary note ────────────────────────────────────────── */}
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)",
              padding: "14px 18px",
              marginBottom: "40px",
            }}
          >
            <p
              style={{
                ...mono,
                fontSize: "8px",
                letterSpacing: "0.12em",
                color: "rgba(255,255,255,0.28)",
                lineHeight: 1.7,
              }}
            >
              <strong style={{ color: "rgba(255,255,255,0.42)", fontWeight: "normal" }}>API boundary.</strong>{" "}
              API responses expose structured records from the governed case registry.
              No response constitutes legal, financial, investment, or professional advice.
              Case summaries and provenance records reflect submitted evidence only —
              they are not independently audited or certified.
            </p>
          </div>

          {/* ── Authentication ───────────────────────────────────────── */}
          <section style={{ marginBottom: "40px" }}>
            <SectionLabel>Authentication</SectionLabel>
            <h2 style={{ ...serif, fontSize: "20px", color: "rgba(255,255,255,0.80)", marginBottom: "12px" }}>
              API key authentication
            </h2>
            <p
              style={{
                ...mono,
                fontSize: "9px",
                color: "rgba(255,255,255,0.40)",
                lineHeight: 1.65,
                marginBottom: "16px",
                maxWidth: "500px",
              }}
            >
              All v1 endpoints require an enterprise API key passed in the{" "}
              <code style={{ color: `${GOLD}CC` }}>x-api-key</code> request header.
              Keys are issued by Abraham of London upon enterprise agreement.
              Keys are SHA-256 hashed at rest — they cannot be recovered after issuance.
            </p>
            <CodeBlock language="http">{`POST /api/v1/cases HTTP/1.1
Host: abrahamoflondon.com
x-api-key: aol_live_your_enterprise_key_here
Content-Type: application/json`}</CodeBlock>
            <p
              style={{
                ...mono,
                fontSize: "8px",
                color: "rgba(255,255,255,0.25)",
                lineHeight: 1.6,
                marginTop: "8px",
              }}
            >
              Rate limit: 60 requests/minute per key. Exceeding this returns HTTP 429.
              Keys can be revoked at any time. Contact us to rotate or revoke keys.
            </p>
          </section>

          <GoldDivider />

          {/* ── Endpoint: POST /api/v1/cases ─────────────────────────── */}
          <section style={{ marginBottom: "40px" }}>
            <SectionLabel>Endpoint</SectionLabel>
            <h2 style={{ ...serif, fontSize: "20px", color: "rgba(255,255,255,0.80)", marginBottom: "16px" }}>
              Create a governed case
            </h2>
            <EndpointBadge method="POST" path="/api/v1/cases" />
            <p
              style={{
                ...mono,
                fontSize: "9px",
                color: "rgba(255,255,255,0.40)",
                lineHeight: 1.65,
                marginBottom: "16px",
                maxWidth: "520px",
              }}
            >
              Creates a governed case intake record. The case is registered in the
              governed case registry with a stable <code style={{ color: `${GOLD}BB` }}>caseId</code>.
              No analysis is run at intake — a governed finding requires a human-initiated
              assessment session.
            </p>

            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.28)", marginBottom: "8px" }}>
              REQUEST BODY
            </p>
            <table style={{ borderCollapse: "collapse", width: "100%", marginBottom: "16px" }}>
              <tbody>
                <FieldRow name="title" type="string" required description="Short label for the case (max 200 chars)" />
                <FieldRow name="decisionText" type="string" required description="Plain-language description of the decision or issue (max 4000 chars)" />
                <FieldRow name="constraintText" type="string" required={false} description="Known constraints on the decision" />
                <FieldRow name="costOfDelayText" type="string" required={false} description="Commercial or operational cost of inaction" />
                <FieldRow name="stakeholderText" type="string" required={false} description="Key stakeholders involved" />
                <FieldRow name="externalRef" type="string" required={false} description="Your reference ID for this case (returned in summary)" />
                <FieldRow name="subjectEmail" type="string" required={false} description="Email of the subject (stored encrypted, not exposed in API)" />
                <FieldRow name="organisation" type="string" required={false} description="Organisation name" />
              </tbody>
            </table>

            <CodeBlock>{`// Example request
{
  "title": "Q3 resource allocation decision",
  "decisionText": "Whether to reallocate engineering capacity from Platform to Growth for Q3.",
  "constraintText": "Platform team committed to two critical compliance deliverables by end of Q3.",
  "costOfDelayText": "Growth roadmap delay estimated at 6 weeks per month of inaction.",
  "externalRef": "JIRA-4821"
}`}</CodeBlock>

            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.28)", marginBottom: "8px", marginTop: "16px" }}>
              RESPONSE — 201 Created
            </p>
            <CodeBlock>{`{
  "ok": true,
  "caseId": "tz4k8m2nq1f9r5p0",
  "message": "Governed case intake record created. ...",
  "summaryUrl": "/api/v1/cases/tz4k8m2nq1f9r5p0/summary",
  "provenanceUrl": "/api/v1/cases/tz4k8m2nq1f9r5p0/provenance"
}`}</CodeBlock>
          </section>

          <GoldDivider />

          {/* ── Endpoint: GET /api/v1/cases/[caseId]/summary ─────────── */}
          <section style={{ marginBottom: "40px" }}>
            <SectionLabel>Endpoint</SectionLabel>
            <h2 style={{ ...serif, fontSize: "20px", color: "rgba(255,255,255,0.80)", marginBottom: "16px" }}>
              Get case summary
            </h2>
            <EndpointBadge method="GET" path="/api/v1/cases/:caseId/summary" />
            <p
              style={{
                ...mono,
                fontSize: "9px",
                color: "rgba(255,255,255,0.40)",
                lineHeight: 1.65,
                marginBottom: "16px",
                maxWidth: "520px",
              }}
            >
              Returns a client-safe structured summary of the governed case record.
              Includes decision objects, evidence nodes, stage count, and record timestamps.
              Only accessible for cases created via the enterprise API by the calling key.
            </p>

            <CodeBlock>{`// Example response
{
  "ok": true,
  "caseId": "tz4k8m2nq1f9r5p0",
  "status": "active",
  "diagnosticType": "api_intake",
  "organisation": "Acme Corp",
  "decisionObjects": [
    {
      "decisionText": "Whether to reallocate engineering capacity...",
      "constraintText": "Platform team committed to two critical...",
      "costOfDelayText": "Growth roadmap delay estimated at 6 weeks...",
      "stakeholderText": null,
      "affectedDomain": null,
      "confidence": 0.5,
      "recordedAt": "2026-05-16T09:00:00.000Z"
    }
  ],
  "evidenceNodes": [],
  "stageCount": 0,
  "createdAt": "2026-05-16T09:00:00.000Z",
  "updatedAt": "2026-05-16T09:00:00.000Z",
  "boundaryNote": "This summary reflects evidence submitted to the governed case record. ..."
}`}</CodeBlock>
          </section>

          <GoldDivider />

          {/* ── Endpoint: GET /api/v1/cases/[caseId]/provenance ──────── */}
          <section style={{ marginBottom: "40px" }}>
            <SectionLabel>Endpoint</SectionLabel>
            <h2 style={{ ...serif, fontSize: "20px", color: "rgba(255,255,255,0.80)", marginBottom: "16px" }}>
              Get case provenance
            </h2>
            <EndpointBadge method="GET" path="/api/v1/cases/:caseId/provenance" />
            <p
              style={{
                ...mono,
                fontSize: "9px",
                color: "rgba(255,255,255,0.40)",
                lineHeight: 1.65,
                marginBottom: "16px",
                maxWidth: "520px",
              }}
            >
              Returns the ordered chronological chain of nodes that constitute the
              governed record of this case — stage records, evidence nodes, and decision
              objects. Each node includes its kind, source stage, summary, confidence,
              and creation timestamp. No PII is exposed.
            </p>

            <CodeBlock>{`// Example response (abbreviated)
{
  "ok": true,
  "caseId": "tz4k8m2nq1f9r5p0",
  "totalNodes": 3,
  "chain": [
    {
      "nodeId": "cm4a...",
      "kind": "decision",
      "sourceStage": "api_intake_v1",
      "label": "Decision record",
      "summary": "Whether to reallocate engineering capacity from Platform to Growth...",
      "confidence": 0.5,
      "recordedAt": "2026-05-16T09:00:00.000Z"
    }
  ],
  "integrityNote": "Each node in this chain represents a discrete governed record event. ...",
  "boundaryNote": "This provenance record is produced from user-submitted and system-recorded data. ..."
}`}</CodeBlock>
          </section>

          <GoldDivider />

          {/* ── Error codes ───────────────────────────────────────────── */}
          <section style={{ marginBottom: "40px" }}>
            <SectionLabel>Error reference</SectionLabel>
            <h2 style={{ ...serif, fontSize: "20px", color: "rgba(255,255,255,0.80)", marginBottom: "16px" }}>
              Error codes
            </h2>
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  {["HTTP", "code", "Description"].map((h) => (
                    <th
                      key={h}
                      style={{
                        ...mono,
                        fontSize: "7px",
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.25)",
                        textAlign: "left",
                        paddingBottom: "8px",
                        paddingRight: "16px",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["401", "—", "Missing, malformed, or invalid x-api-key header"],
                  ["400", "VALIDATION_ERROR", "Required fields missing or exceeding limits"],
                  ["400", "INVALID_BODY", "Request body could not be parsed as JSON"],
                  ["403", "ACCESS_DENIED", "API key valid, but not authorised for this resource"],
                  ["404", "NOT_FOUND", "Case does not exist"],
                  ["405", "—", "HTTP method not allowed on this endpoint"],
                  ["429", "—", "Rate limit exceeded (60 req/min per key)"],
                  ["500", "INTERNAL_ERROR", "Server-side failure — contact support"],
                ].map(([status, code, desc]) => (
                  <tr key={`${status}-${code}`}>
                    <td style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.55)", paddingTop: "8px", paddingBottom: "8px", paddingRight: "16px", verticalAlign: "top" }}>
                      {status}
                    </td>
                    <td style={{ ...mono, fontSize: "9px", color: `${GOLD}AA`, paddingTop: "8px", paddingBottom: "8px", paddingRight: "16px", verticalAlign: "top", whiteSpace: "nowrap" }}>
                      {code}
                    </td>
                    <td style={{ ...mono, fontSize: "9px", color: "rgba(255,255,255,0.40)", paddingTop: "8px", paddingBottom: "8px", verticalAlign: "top", lineHeight: 1.6 }}>
                      {desc}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <GoldDivider />

          {/* ── Access ────────────────────────────────────────────────── */}
          <section style={{ marginBottom: "40px" }}>
            <SectionLabel>Access</SectionLabel>
            <h2 style={{ ...serif, fontSize: "20px", color: "rgba(255,255,255,0.80)", marginBottom: "12px" }}>
              Requesting API access
            </h2>
            <p
              style={{
                ...mono,
                fontSize: "9px",
                color: "rgba(255,255,255,0.40)",
                lineHeight: 1.65,
                marginBottom: "20px",
                maxWidth: "500px",
              }}
            >
              Enterprise API access is not self-serve. Keys are issued to contracted
              organisations following a brief onboarding call. To request access, contact
              us with a description of your integration use case.
            </p>
            <Link
              href="/contact"
              style={{
                ...mono,
                fontSize: "9px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: GOLD,
                border: `1px solid ${GOLD}40`,
                background: `${GOLD}0A`,
                padding: "10px 18px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Request enterprise access
            </Link>
          </section>

          {/* ── Footer nav ───────────────────────────────────────────── */}
          <nav
            style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              paddingTop: "28px",
              display: "flex",
              gap: "24px",
              flexWrap: "wrap",
            }}
          >
            {[
              { label: "Design Partners", href: "/design-partners" },
              { label: "Pricing", href: "/pricing" },
              { label: "Trust & Security", href: "/trust" },
              { label: "Contact", href: "/contact" },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                style={{
                  ...mono,
                  fontSize: "8px",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.32)",
                  textDecoration: "none",
                }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
