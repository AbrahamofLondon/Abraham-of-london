/* components/strategy-room/ArtifactGrid.tsx — canonical artefact access intake */
"use client";

import * as React from "react";
import {
  ArrowRight,
  Loader2,
  Lock,
  AlertTriangle,
  ShieldCheck,
  FileStack,
} from "lucide-react";

type SubmitState = "idle" | "success" | "error";

type AccessFormFields = {
  name: string;
  email: string;
  intent: string;
};

function hasRecaptchaSiteKey(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY);
}

async function getSafeRecaptchaToken(action: string): Promise<string | null> {
  if (!hasRecaptchaSiteKey()) return null;

  try {
    const mod = await import("@/lib/recaptchaClient");
    if (typeof mod.getRecaptchaTokenSafe === "function") {
      return await mod.getRecaptchaTokenSafe(action);
    }
    return null;
  } catch (error) {
    console.warn("[ArtifactGrid] reCAPTCHA unavailable; continuing without token.", error);
    return null;
  }
}

function normalizeFields(formData: FormData): AccessFormFields {
  return {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    intent: String(formData.get("intent") || "").trim(),
  };
}

function validateFields(fields: AccessFormFields): string | null {
  if (!fields.name || !fields.email || !fields.intent) {
    return "Incomplete institutional data.";
  }

  if (!fields.email.includes("@")) {
    return "A valid institutional email is required.";
  }

  if (fields.intent.length < 12) {
    return "Strategic intent is too brief. Provide enough context to review properly.";
  }

  return null;
}

export default function ArtifactGrid() {
  const [loading, setLoading] = React.useState(false);
  const [submitState, setSubmitState] = React.useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [notice, setNotice] = React.useState("");

  const recaptchaEnabled = hasRecaptchaSiteKey();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSubmitState("idle");
    setErrorMessage("");
    setNotice("");

    const fields = normalizeFields(new FormData(e.currentTarget));
    const validationError = validateFields(fields);

    if (validationError) {
      setSubmitState("error");
      setErrorMessage(validationError);
      setLoading(false);
      return;
    }

    try {
      const token = await getSafeRecaptchaToken("artifact_access_request");

      const res = await fetch("/api/strategy-room/enrol", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: fields.name,
          fullName: fields.name,
          email: fields.email,
          intent: fields.intent,
          message: fields.intent,
          source: "artifact_grid",
          token,
          metadata: {
            surface: "strategy_room_artifact_grid",
          },
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSubmitState("error");
        setErrorMessage(
          typeof json?.error === "string"
            ? json.error
            : "Submission failed. Please try again."
        );
        return;
      }

      setSubmitState("success");
      setNotice(
        typeof json?.message === "string"
          ? json.message
          : "Request logged. Access review will proceed through the standard triage sequence."
      );
      (e.currentTarget as HTMLFormElement).reset();
    } catch (error: any) {
      console.error("[ArtifactGrid] Submission error:", error);
      setSubmitState("error");
      setErrorMessage(
        error?.message || "Transmission interrupted. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-white/10 bg-white/[0.02] p-6 md:p-8">
        <div className="mb-6 flex items-start gap-4">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3">
            <Lock className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-serif text-2xl text-white/95">Access the Materials</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
              The Strategy Room draws from the Canon and the Strategic Frameworks
              library. Inner Circle members receive full artifact access.
            </p>
          </div>
        </div>

        {!recaptchaEnabled ? (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-200/80">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-amber-400">
                Security Notice
              </div>
              <p className="mt-1 text-sm leading-relaxed">
                reCAPTCHA is not configured in this environment. Intake will still
                submit where non-production bypass is enabled, but bot screening is degraded.
              </p>
            </div>
          </div>
        ) : null}

        {submitState === "error" && errorMessage ? (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-red-400">
                Submission Error
              </div>
              <p className="mt-1 text-sm leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        ) : null}

        {submitState === "success" && notice ? (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-200/90">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-emerald-400">
                Request Logged
              </div>
              <p className="mt-1 text-sm leading-relaxed">{notice}</p>
            </div>
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="space-y-px overflow-hidden rounded-2xl border border-white/5 bg-white/5"
        >
          <div className="grid gap-px md:grid-cols-2">
            <input
              required
              name="name"
              autoComplete="name"
              placeholder="IDENTIFIER (NAME)"
              className="border-none bg-black p-6 font-mono text-[10px] uppercase tracking-widest text-white outline-none transition-colors placeholder:text-white/25 focus:text-primary"
            />
            <input
              required
              name="email"
              type="email"
              autoComplete="email"
              placeholder="INSTITUTIONAL EMAIL"
              className="border-none bg-black p-6 font-mono text-[10px] uppercase tracking-widest text-white outline-none transition-colors placeholder:text-white/25 focus:text-primary"
            />
          </div>

          <textarea
            required
            name="intent"
            rows={4}
            placeholder="NATURE OF INQUIRY / STRATEGIC INTENT"
            className="w-full resize-none border-none bg-black p-6 font-mono text-[10px] uppercase tracking-widest text-white outline-none transition-colors placeholder:text-white/25 focus:text-primary"
          />

          <button
            type="submit"
            disabled={loading}
            className="group flex w-full items-center justify-center gap-4 bg-primary p-6 font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing Request
              </>
            ) : (
              <>
                Unlock Inner Circle Access
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-white/35">
          <FileStack className="h-3.5 w-3.5 text-primary/70" />
          Intake-first. Review follows structured triage.
        </div>
      </div>
    </div>
  );
}