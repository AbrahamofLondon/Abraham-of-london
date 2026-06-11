/**
 * pages/retainers/readiness.tsx — Retainer readiness intake
 *
 * Collects structured information to assess whether an account
 * is ready for retainer oversight. No auth required.
 * On submission, creates RetainerReadinessEvaluation with readinessClass=CANDIDATE.
 * No automatic approval. No contract creation.
 */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import { validateReadinessIntake } from "@/lib/retainers/retainer-pipeline-contracts";
import type { ReadinessIntakeInput } from "@/lib/retainers/retainer-pipeline-contracts";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif" };

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#0d0d12",
  border: "1px solid #2a2a32",
  borderRadius: 3,
  color: "#e8e0d0",
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 13,
  padding: "10px 12px",
  boxSizing: "border-box",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  ...mono,
  fontSize: 11,
  letterSpacing: "0.1em",
  color: GOLD,
  textTransform: "uppercase",
  display: "block",
  marginBottom: 8,
};

const helpStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#5e5850",
  marginTop: 6,
  lineHeight: 1.5,
};

type FieldDef = {
  id: keyof ReadinessIntakeInput;
  label: string;
  placeholder: string;
  help?: string;
  type?: "text" | "select" | "textarea" | "checkbox";
  options?: string[];
  rows?: number;
};

const FIELDS: FieldDef[] = [
  {
    id: "organisationType",
    label: "Organisation type",
    type: "select",
    options: ["Founder-led business", "Executive team", "Board or advisory body", "Investment portfolio company", "Professional services firm", "Other"],
    placeholder: "",
    help: "Select the category that best describes your organisation.",
  },
  {
    id: "decisionPressureFrequency",
    label: "Decision pressure frequency",
    type: "select",
    options: ["Multiple per month", "Once or twice a month", "Every quarter", "Irregular — but high-stakes when they occur"],
    placeholder: "",
    help: "How often do you face decisions that require structured analysis?",
  },
  {
    id: "activeDecisionsCount",
    label: "Active decisions requiring oversight",
    placeholder: "e.g. 2 board-level capital decisions, 1 regulatory compliance question",
    help: "List the decisions or situations that are currently unresolved or unmonitored.",
    rows: 3,
  },
  {
    id: "unresolvedRisks",
    label: "Unresolved risks",
    placeholder: "Name the risks that are open and have not been closed by prior analysis.",
    rows: 3,
  },
  {
    id: "governanceContext",
    label: "Governance context",
    placeholder: "Who has authority to act on oversight recommendations? What is the decision-making structure?",
    rows: 3,
  },
  {
    id: "monthlyOversightNeed",
    label: "Monthly oversight need",
    placeholder: "What condition, pattern, or risk requires monthly review rather than a one-off brief?",
    rows: 4,
  },
  {
    id: "urgencyLevel",
    label: "Urgency",
    type: "select",
    options: ["Immediate — within this month", "Near-term — within 3 months", "Medium-term — within 6 months", "Long-term — ongoing governance need"],
    placeholder: "",
  },
  {
    id: "priorProductUse",
    label: "Prior product use (optional)",
    placeholder: "Have you used Boardroom Brief, Strategy Room, or Executive Report? If so, briefly describe the outcome.",
    rows: 2,
  },
  {
    id: "priorBoardroomOrderId",
    label: "Prior Boardroom Brief order ID (optional)",
    placeholder: "e.g. order-cm...",
    help: "If you have a prior Boardroom Brief order, entering the ID links your readiness review to that delivery record.",
  },
  {
    id: "contactEmail",
    label: "Contact email",
    type: "text",
    placeholder: "your@email.com",
    help: "A member of the team will respond to this address.",
  },
];

const INITIAL_FORM: Partial<ReadinessIntakeInput> = {};

export default function RetainerReadinessPage() {
  const [form, setForm] = React.useState<Partial<ReadinessIntakeInput>>(INITIAL_FORM);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [serverError, setServerError] = React.useState("");
  const [touched, setTouched] = React.useState<Set<string>>(new Set());

  const validation = validateReadinessIntake(form);

  function updateField(id: keyof ReadinessIntakeInput, value: string | boolean) {
    setForm(prev => ({ ...prev, [id]: value }));
  }

  function touch(id: string) {
    setTouched(prev => new Set(prev).add(id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validation.valid) {
      const allFields = new Set(FIELDS.map(f => f.id));
      allFields.add("consentToReview");
      setTouched(allFields as Set<string>);
      return;
    }
    setSubmitting(true);
    setServerError("");
    try {
      const res = await fetch("/api/retainers/readiness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error ?? "Submission failed.");
      }
      setSubmitted(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Layout>
        <Head><title>Readiness Review Submitted | Abraham of London</title></Head>
        <div style={{ background: "#060609", minHeight: "100vh", padding: "80px 24px" }}>
          <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
            <p style={{ ...mono, fontSize: 11, color: GOLD, letterSpacing: "0.15em", marginBottom: 24 }}>SUBMITTED</p>
            <h1 style={{ ...serif, fontSize: 32, fontWeight: 300, color: "#f5f0e8", marginBottom: 20 }}>
              Readiness review received
            </h1>
            <p style={{ fontSize: 15, color: "#7e7870", lineHeight: 1.7, marginBottom: 32 }}>
              Your submission has been logged. A member of the team will review it and respond
              to your email address. This typically takes two to three business days.
            </p>
            <p style={{ fontSize: 13, color: "#5e5850", marginBottom: 32 }}>
              No contract has been created. No commitment has been made. This is a readiness
              review — the next step is a direct conversation.
            </p>
            <Link href="/retainers" style={{ ...mono, fontSize: 11, color: GOLD, textDecoration: "none", letterSpacing: "0.1em" }}>
              ← BACK TO RETAINER OVERSIGHT
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const isMissing = (id: string) =>
    touched.has(id) && (!validation.valid) && (validation as { missing: string[] }).missing?.includes(id);

  return (
    <Layout>
      <Head>
        <title>Retainer Readiness Review | Abraham of London</title>
        <meta name="description" content="Request a retainer readiness review. Structured intake for governed oversight." />
      </Head>

      <main style={{ background: "#060609", color: "#e8e0d0", minHeight: "100vh" }}>
        <section style={{ borderBottom: "1px solid #1e1e24", padding: "64px 24px 48px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <Link href="/retainers" style={{ ...mono, fontSize: 11, color: "#5e5850", textDecoration: "none", letterSpacing: "0.1em" }}>
              ← RETAINER OVERSIGHT
            </Link>
            <p style={{ ...mono, fontSize: 11, letterSpacing: "0.15em", color: GOLD, textTransform: "uppercase", marginTop: 24, marginBottom: 16 }}>
              READINESS REVIEW
            </p>
            <h1 style={{ ...serif, fontSize: 36, fontWeight: 300, color: "#f5f0e8", marginBottom: 16 }}>
              Retainer readiness intake
            </h1>
            <p style={{ fontSize: 15, color: "#7e7870", lineHeight: 1.7 }}>
              This form collects the structural information required to assess whether ongoing
              oversight addresses a genuine governance need. It is not a purchase form and does
              not create a contract. A member of the team will review your submission and respond directly.
            </p>
          </div>
        </section>

        <form onSubmit={handleSubmit} style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>
          {FIELDS.map(field => (
            <div key={field.id} style={{ marginBottom: 32 }}>
              <label htmlFor={field.id} style={labelStyle}>{field.label}</label>
              {field.type === "select" ? (
                <select
                  id={field.id}
                  value={(form[field.id] as string) ?? ""}
                  onChange={e => updateField(field.id, e.target.value)}
                  onBlur={() => touch(field.id)}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="">Select…</option>
                  {field.options?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.rows ? (
                <textarea
                  id={field.id}
                  rows={field.rows}
                  value={(form[field.id] as string) ?? ""}
                  onChange={e => updateField(field.id, e.target.value)}
                  onBlur={() => touch(field.id)}
                  placeholder={field.placeholder}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              ) : (
                <input
                  id={field.id}
                  type={field.type ?? "text"}
                  value={(form[field.id] as string) ?? ""}
                  onChange={e => updateField(field.id, e.target.value)}
                  onBlur={() => touch(field.id)}
                  placeholder={field.placeholder}
                  style={inputStyle}
                />
              )}
              {field.help && <p style={helpStyle}>{field.help}</p>}
              {isMissing(field.id) && (
                <p style={{ ...mono, fontSize: 11, color: "#c0392b", marginTop: 6 }}>This field is required.</p>
              )}
            </div>
          ))}

          {/* Consent */}
          <div style={{ marginBottom: 40, padding: "20px", background: "#0d0d12", border: "1px solid #1e1e24", borderRadius: 4 }}>
            <label style={{ display: "flex", gap: 12, cursor: "pointer", alignItems: "flex-start" }}>
              <input
                type="checkbox"
                checked={form.consentToReview === true}
                onChange={e => updateField("consentToReview", e.target.checked)}
                style={{ marginTop: 3, flexShrink: 0 }}
              />
              <span style={{ fontSize: 13, color: "#9e9890", lineHeight: 1.6 }}>
                I consent to the information supplied in this form being reviewed by the Abraham of London
                team for the purpose of assessing retainer readiness. I understand this does not create
                a contract, obligation, or commitment on either side.
              </span>
            </label>
            {isMissing("consentToReview") && (
              <p style={{ ...mono, fontSize: 11, color: "#c0392b", marginTop: 8 }}>Consent is required to submit.</p>
            )}
          </div>

          {serverError && (
            <p style={{ ...mono, fontSize: 12, color: "#c0392b", marginBottom: 20 }}>{serverError}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              background: submitting ? "#2a2a32" : GOLD,
              color: "#060609",
              border: "none",
              padding: "14px 32px",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: submitting ? "not-allowed" : "pointer",
              borderRadius: 2,
            }}
          >
            {submitting ? "Submitting…" : "Submit Readiness Review"}
          </button>

          <p style={{ fontSize: 12, color: "#3e3830", marginTop: 16, lineHeight: 1.6 }}>
            Submission does not create a contract. A member of the team will review your intake
            and respond within two to three business days.
          </p>
        </form>
      </main>
    </Layout>
  );
}
