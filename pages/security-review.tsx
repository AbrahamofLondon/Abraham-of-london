/**
 * pages/security-review.tsx
 *
 * /security-review
 *
 * For enterprise procurement, legal, and security teams requesting
 * a formal security review pack, DPA, or architecture briefing.
 *
 * No false certification claims. Honest status on every item.
 */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { Shield, ArrowRight, FileText, Mail, Lock, AlertTriangle, ExternalLink } from "lucide-react";
import Layout from "@/components/Layout";
import LegalIdentityBlock from "@/components/trust/LegalIdentityBlock";
import SecurityAssuranceStatusStrip from "@/components/trust/SecurityAssuranceStatusStrip";
import {
  getSecurityAssuranceMaterials,
  getSecurityAssuranceRequestHref,
} from "@/lib/security-assurance/security-assurance-pack-registry";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

const LEVEL_LABEL: Record<string, string> = {
  PUBLIC: "Public",
  REQUESTABLE: "Controlled — request required",
  RESTRICTED: "Restricted — review + NDA required",
};

const LEVEL_COLOR: Record<string, string> = {
  PUBLIC: "rgba(110,231,183,0.65)",
  REQUESTABLE: "rgba(253,186,116,0.65)",
  RESTRICTED: "rgba(252,165,165,0.60)",
};

const SecurityReviewPage: NextPage = () => {
  const materials = getSecurityAssuranceMaterials();

  return (
    <Layout
      title="Security Review Pack | Abraham of London"
      description="Enterprise security review request — what is available now, what is planned, and how to initiate a review."
    >
      <Head>
        <meta name="robots" content="noindex,follow" />
      </Head>

      <main
        className="min-h-screen py-20"
        style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}
      >
        <div className="mx-auto max-w-2xl space-y-8">

          {/* ── HEADER ──────────────────────────────────────────────── */}
          <header>
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
              Enterprise · Procurement · Security
            </div>

            <div className="flex items-center gap-3 mb-3">
              <Shield className="h-5 w-5" style={{ color: GOLD }} />
              <h1
                style={{
                  ...serif,
                  fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                  lineHeight: 1.1,
                  color: "rgba(255,255,255,0.92)",
                }}
              >
                Security Review Pack
              </h1>
            </div>

            <p
              style={{
                ...serif,
                fontSize: "1rem",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.60)",
              }}
            >
              For security, legal, and procurement teams evaluating Abraham of
              London for enterprise or regulated-industry deployment.
              We document exactly what is available and what is not.
            </p>
          </header>

          <LegalIdentityBlock />

          <SecurityAssuranceStatusStrip />

          {/* ── REQUEST PROCESS NOTICE ──────────────────────────────── */}
          <section
            style={{
              border: `1px solid ${GOLD}18`,
              backgroundColor: `${GOLD}04`,
              padding: "1rem",
            }}
          >
            <p
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: `${GOLD}88`,
                marginBottom: "0.65rem",
              }}
            >
              Controlled request process
            </p>
            <p
              style={{
                ...serif,
                fontSize: "0.95rem",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.60)",
              }}
            >
              Security assurance materials are shared through a controlled request process. Public summaries are available immediately; detailed materials may require review, qualification, or NDA depending on sensitivity.
            </p>
            <p
              style={{
                ...serif,
                fontSize: "0.85rem",
                lineHeight: 1.65,
                color: "rgba(255,255,255,0.40)",
                marginTop: "0.65rem",
              }}
            >
              SOC 2, ISO 27001 certification, and independent penetration testing are not yet complete and are not represented as completed.
            </p>
          </section>

          {/* ── OPERATIONAL BOUNDARIES ─────────────────────────────── */}
          <section
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              backgroundColor: "rgba(255,255,255,0.015)",
              padding: "1rem",
            }}
          >
            <p
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: `${GOLD}88`,
                marginBottom: "0.75rem",
              }}
            >
              Administrative access and internal review
            </p>
            <div className="space-y-3">
              <p
                style={{
                  ...serif,
                  fontSize: "0.92rem",
                  lineHeight: 1.7,
                  color: "rgba(255,255,255,0.60)",
                }}
              >
                Administrative access is limited to authorised operator/admin roles and is used for support, review, delivery, and security operations. Access to restricted assurance materials and operational records is controlled through admin review workflows. Certain provenance and admin operations are logged for review.
              </p>
              <p
                style={{
                  ...serif,
                  fontSize: "0.9rem",
                  lineHeight: 1.65,
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                MFA / SSO: Current authentication is handled through the platform&apos;s configured authentication provider and supported sign-in methods. Enterprise SSO and enforced organisation-level MFA are not yet represented as generally available. Availability can be reviewed for qualified enterprise deployments.
              </p>
              <p
                style={{
                  ...serif,
                  fontSize: "0.9rem",
                  lineHeight: 1.65,
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                Detailed internal access procedures can be discussed during procurement or security review.
              </p>
            </div>
          </section>

          <section
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              backgroundColor: "rgba(255,255,255,0.015)",
              padding: "1rem",
            }}
          >
            <p
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: `${GOLD}88`,
                marginBottom: "0.75rem",
              }}
            >
              Enterprise operating caveats
            </p>
            <div className="space-y-3">
              <p style={{ ...serif, fontSize: "0.9rem", lineHeight: 1.65, color: "rgba(255,255,255,0.60)" }}>
                Data residency and transfers: Default infrastructure may involve UK/EU/US provider regions depending on the service used. Region-specific deployment, data residency commitments, transfer terms, DPA, and sub-processor review must be agreed as part of enterprise procurement or contract review. The platform does not currently represent a blanket residency guarantee for all accounts.
              </p>
              <p style={{ ...serif, fontSize: "0.9rem", lineHeight: 1.65, color: "rgba(255,255,255,0.60)" }}>
                Analytics and telemetry: Product analytics may be used to understand usage, reliability, and product improvement. Analytics should not be used to sell personal data or for ad-tech sharing. Specific telemetry fields, analytics configuration, and account-level restrictions can be reviewed through the security assurance process.
              </p>
              <p style={{ ...serif, fontSize: "0.9rem", lineHeight: 1.65, color: "rgba(255,255,255,0.60)" }}>
                Backups and restore: The platform uses provider/database backup mechanisms appropriate to the current deployment. Formal enterprise RTO/RPO commitments are not yet represented as generally available and should be agreed during enterprise procurement. Restore-testing posture and available evidence can be discussed through the security assurance request process.
              </p>
              <p style={{ ...serif, fontSize: "0.9rem", lineHeight: 1.65, color: "rgba(255,255,255,0.60)" }}>
                Status and incident visibility: A public status page is not yet published. Internal/system health checks exist, but they should not be read as a public status history or uptime SLA. For current pilots, incident communication expectations should be agreed within the engagement scope.
              </p>
            </div>
          </section>

          {/* ── MATERIAL REGISTRY — ACTIONABLE CARDS ────────────────── */}
          <section
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.015)",
              padding: "1.25rem",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4" style={{ color: `${GOLD}70` }} />
              <p
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: `${GOLD}88`,
                }}
              >
                Available materials
              </p>
            </div>

            <div className="space-y-3">
              {materials.map((material) => (
                <div
                  key={material.id}
                  style={{
                    border: "1px solid rgba(255,255,255,0.06)",
                    backgroundColor: "rgba(255,255,255,0.015)",
                    padding: "0.9rem",
                  }}
                >
                  {/* Disclosure label */}
                  <div style={{ marginBottom: "0.4rem" }}>
                    <span
                      style={{
                        ...mono,
                        fontSize: "6.5px",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: LEVEL_COLOR[material.disclosureLevel],
                        border: `1px solid ${LEVEL_COLOR[material.disclosureLevel]}33`,
                        padding: "1px 6px",
                      }}
                    >
                      {LEVEL_LABEL[material.disclosureLevel]}
                    </span>
                    {material.requiresNda && (
                      <span
                        style={{
                          ...mono,
                          fontSize: "6px",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "rgba(252,165,165,0.45)",
                          marginLeft: "0.5rem",
                        }}
                      >
                        NDA
                      </span>
                    )}
                  </div>

                  {/* Title + description */}
                  <p
                    style={{
                      ...serif,
                      fontSize: "0.93rem",
                      color: "rgba(255,255,255,0.80)",
                      lineHeight: 1.4,
                      marginBottom: "0.25rem",
                    }}
                  >
                    {material.title}
                  </p>
                  <p
                    style={{
                      ...serif,
                      fontSize: "0.82rem",
                      lineHeight: 1.6,
                      color: "rgba(255,255,255,0.42)",
                      marginBottom: "0.7rem",
                    }}
                  >
                    {material.description}
                  </p>

                  {/* CTAs */}
                  <div className="flex flex-wrap gap-2">
                    {material.disclosureLevel === "PUBLIC" && material.publicHref && (
                      <Link
                        href={material.publicHref}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          ...mono,
                          fontSize: "7px",
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: "rgba(110,231,183,0.75)",
                          border: "1px solid rgba(110,231,183,0.20)",
                          padding: "0.3rem 0.7rem",
                          textDecoration: "none",
                          backgroundColor: "rgba(110,231,183,0.04)",
                        }}
                      >
                        <ExternalLink style={{ width: 9, height: 9 }} />
                        View public summary
                      </Link>
                    )}

                    {material.disclosureLevel === "REQUESTABLE" && (
                      <Link
                        href={getSecurityAssuranceRequestHref(material.id)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          ...mono,
                          fontSize: "7px",
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: `${GOLD}CC`,
                          border: `1px solid ${GOLD}30`,
                          padding: "0.3rem 0.7rem",
                          textDecoration: "none",
                          backgroundColor: `${GOLD}06`,
                        }}
                      >
                        <Mail style={{ width: 9, height: 9 }} />
                        Request this material
                      </Link>
                    )}

                    {material.disclosureLevel === "RESTRICTED" && (
                      <Link
                        href={getSecurityAssuranceRequestHref(material.id)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          ...mono,
                          fontSize: "7px",
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: "rgba(252,165,165,0.65)",
                          border: "1px solid rgba(252,165,165,0.18)",
                          padding: "0.3rem 0.7rem",
                          textDecoration: "none",
                          backgroundColor: "rgba(252,165,165,0.03)",
                        }}
                      >
                        <Lock style={{ width: 9, height: 9 }} />
                        Request review
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── HONEST POSTURE NOTE ─────────────────────────────────── */}
          <section
            style={{
              border: "1px solid rgba(255,200,80,0.15)",
              backgroundColor: "rgba(255,200,80,0.03)",
              padding: "1rem",
            }}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ color: "rgba(255,200,80,0.6)" }}
              />
              <div>
                <p
                  style={{
                    ...mono,
                    fontSize: "7px",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(255,200,80,0.7)",
                    marginBottom: "0.5rem",
                  }}
                >
                  Honest posture
                </p>
                <p
                  style={{
                    ...serif,
                    fontSize: "0.9rem",
                    lineHeight: 1.65,
                    color: "rgba(255,255,255,0.60)",
                  }}
                >
                  We are a growth-stage product. SOC 2, ISO 27001, and an
                  independent penetration test are planned — not yet completed.
                  If your procurement process requires these before evaluation,
                  we recommend beginning the design partner programme while
                  these are in progress. We will not claim certifications we
                  do not hold.
                </p>
              </div>
            </div>
          </section>

          <section
            style={{
              border: `1px solid ${GOLD}18`,
              backgroundColor: `${GOLD}04`,
              padding: "1rem",
            }}
          >
            <p
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: `${GOLD}88`,
                marginBottom: "0.65rem",
              }}
            >
              Enterprise readiness boundary
            </p>
            <p
              style={{
                ...serif,
                fontSize: "0.95rem",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.60)",
              }}
            >
              The platform is suitable for bounded pilots and structured assurance review. It is not yet represented as SOC 2 certified, ISO 27001 certified, independently penetration-tested, or externally audited. High-sensitivity, regulated, or mission-critical deployments should proceed through security review, DPA / sub-processor review, and agreed operational controls before production use.
            </p>
          </section>

          {/* ── REQUEST SECURITY ASSURANCE PACK ─────────────────────── */}
          <section
            id="request-security-assurance-pack"
            className="scroll-mt-28"
            style={{
              border: `1px solid ${GOLD}22`,
              backgroundColor: `${GOLD}05`,
              padding: "1.25rem",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Lock className="h-4 w-4" style={{ color: `${GOLD}70` }} />
              <p
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: `${GOLD}88`,
                }}
              >
                Request security assurance pack
              </p>
            </div>

            <p
              style={{
                ...serif,
                fontSize: "0.95rem",
                lineHeight: 1.65,
                color: "rgba(255,255,255,0.60)",
                marginBottom: "1.25rem",
              }}
            >
              Serious prospects may request the controlled pack for procurement review. It covers legal identity, infrastructure and provider posture, named sub-processors, pilot data-boundary guidance, incident-response posture, and the current independent-assurance status.
            </p>

            <p
              style={{
                ...serif,
                fontSize: "0.9rem",
                lineHeight: 1.65,
                color: "rgba(255,255,255,0.55)",
                marginBottom: "1.25rem",
              }}
            >
              Not yet complete: SOC 2, ISO 27001 organisational certification, and independent external penetration testing.
            </p>

            <Link
              href="/contact?type=security-assurance"
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
                padding: "0.7rem 1.25rem",
                textDecoration: "none",
              }}
            >
              <Mail className="h-3.5 w-3.5" />
              Request security assurance pack
            </Link>
          </section>

          {/* ── CROSS-LINKS ─────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/trust"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.06)",
                padding: "0.35rem 0.7rem",
              }}
            >
              ← Trust Center
            </Link>
            <Link
              href="/design-partners"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.06)",
                padding: "0.35rem 0.7rem",
              }}
            >
              Design partner programme
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

        </div>
      </main>
    </Layout>
  );
};

export default SecurityReviewPage;
