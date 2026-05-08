import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { resolvePageAccess } from "@/lib/access/server";
import { RETAINER_INTAKE_QUESTIONS, validateRetainerIntake, type RetainerIntakeResponse } from "@/lib/product/retainer-intake-contract";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { session, access } = await resolvePageAccess(ctx);
  if (!access.permissions.isAuthenticated || !session?.user?.email) {
    return {
      redirect: {
        destination: `/api/auth/signin?callbackUrl=${encodeURIComponent(ctx.resolvedUrl)}`,
        permanent: false,
      },
    };
  }
  return { props: {} };
};

const RetainerIntakePage: NextPage = () => {
  const router = useRouter();
  const [form, setForm] = React.useState<Partial<RetainerIntakeResponse>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState("");

  const validation = validateRetainerIntake(form);

  async function handleSubmit() {
    if (!validation.valid) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/internal/retainer/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intake: form }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error((data as { error?: string })?.error || "Submission failed.");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Layout>
        <Head><title>Oversight Intake Submitted | Abraham of London</title></Head>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "120px 24px 80px" }}>
          <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.32em", textTransform: "uppercase", color: GOLD }}>
            Governed oversight intake
          </p>
          <h1 style={{ ...serif, fontSize: "clamp(2rem, 4vw, 3rem)", marginTop: 16, color: "#F5F5F5" }}>
            Intake recorded.
          </h1>
          <p style={{ ...serif, fontSize: "1rem", lineHeight: 1.7, marginTop: 16, color: "rgba(255,255,255,0.55)" }}>
            Your oversight mandate has been submitted. The system will evaluate readiness,
            evidence coverage, and governance fit before confirming oversight activation.
            You will be contacted with next steps.
          </p>
          <p style={{ ...serif, fontSize: "0.9rem", lineHeight: 1.7, marginTop: 24, color: "rgba(255,255,255,0.35)" }}>
            This intake does not guarantee acceptance. Oversight is only activated when
            the evidence base supports it and the authority structure is clear.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head><title>Oversight Intake | Abraham of London</title></Head>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "120px 24px 80px" }}>
        <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.32em", textTransform: "uppercase", color: GOLD }}>
          Governed oversight intake
        </p>
        <h1 style={{ ...serif, fontSize: "clamp(2rem, 4vw, 3rem)", marginTop: 16, color: "#F5F5F5" }}>
          Oversight readiness.
        </h1>
        <p style={{ ...serif, fontSize: "1rem", lineHeight: 1.7, marginTop: 16, color: "rgba(255,255,255,0.55)" }}>
          This intake establishes the structural mandate for ongoing oversight.
          It is not a sales form. It captures why oversight is required, what has
          already been tried, and what evidence would prove oversight is working.
        </p>
        <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", marginTop: 24, color: "rgba(255,255,255,0.25)" }}>
          Completing this intake does not activate oversight or commit to pricing.
        </p>

        <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 32 }}>
          {RETAINER_INTAKE_QUESTIONS.map((q, idx) => (
            <div key={q.id} style={{ borderLeft: `1px solid rgba(255,255,255,0.06)`, paddingLeft: 24 }}>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: GOLD, opacity: 0.6 }}>
                {q.label}{q.required ? " *" : ""}
              </p>
              <p style={{ ...serif, fontSize: "1.15rem", lineHeight: 1.5, marginTop: 8, color: "rgba(255,255,255,0.82)" }}>
                {q.question}
              </p>
              {q.help && (
                <p style={{ ...serif, fontSize: "0.8rem", lineHeight: 1.6, marginTop: 4, color: "rgba(255,255,255,0.28)", fontStyle: "italic" }}>
                  {q.help}
                </p>
              )}
              <textarea
                value={form[q.id] || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, [q.id]: e.target.value }))}
                rows={q.rows}
                placeholder={q.placeholder}
                style={{
                  width: "100%",
                  marginTop: 12,
                  padding: "12px 14px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#F5F5F5",
                  fontSize: "0.9rem",
                  lineHeight: 1.65,
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  resize: "vertical",
                }}
              />
            </div>
          ))}
        </div>

        {error && (
          <p style={{ ...mono, fontSize: "11px", color: "#f87171", marginTop: 24 }}>{error}</p>
        )}

        <div style={{ marginTop: 48, display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={handleSubmit}
            disabled={!validation.valid || submitting}
            style={{
              padding: "14px 32px",
              background: validation.valid ? GOLD : "rgba(255,255,255,0.06)",
              color: validation.valid ? "#000" : "rgba(255,255,255,0.25)",
              border: "none",
              cursor: validation.valid ? "pointer" : "not-allowed",
              ...mono,
              fontSize: "9px",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              fontWeight: 700,
              opacity: submitting ? 0.5 : 1,
            }}
          >
            {submitting ? "Submitting..." : "Submit oversight intake"}
          </button>
          {validation.missing.length > 0 && (
            <p style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>
              {validation.missing.length} required field{validation.missing.length > 1 ? "s" : ""} remaining
            </p>
          )}
        </div>

        <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", marginTop: 32, color: "rgba(255,255,255,0.15)" }}>
          Responses are confidential. Oversight activation is subject to governance review.
        </p>
      </div>
    </Layout>
  );
};

export default RetainerIntakePage;
