/* components/strategy-room/ArtifactGrid.tsx — governed artefact access surface */
"use client";

import * as React from "react";
import {
  ArrowRight,
  Loader2,
  Lock,
  AlertTriangle,
  ShieldCheck,
  FileStack,
  Crown,
  Compass,
  CheckCircle2,
  Sparkles,
  Eye,
} from "lucide-react";

type SubmitState = "idle" | "success" | "error";

type AccessFormFields = {
  name: string;
  email: string;
  organisation: string;
  role: string;
  intent: string;
};

const STORAGE_KEY = "artifact-grid-access-v2";
const AUTO_SAVE_DELAY_MS = 900;

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

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
    organisation: String(formData.get("organisation") || "").trim(),
    role: String(formData.get("role") || "").trim(),
    intent: String(formData.get("intent") || "").trim(),
  };
}

function validateFields(fields: AccessFormFields): string | null {
  if (!fields.name || !fields.email || !fields.organisation || !fields.role || !fields.intent) {
    return "Complete the full access request before submission.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    return "A valid institutional email is required.";
  }

  if (fields.intent.length < 30) {
    return "The inquiry is too brief. State the strategic purpose with enough substance to review properly.";
  }

  return null;
}

function computeCompletion(fields: AccessFormFields): number {
  const required = [
    fields.name,
    fields.email,
    fields.organisation,
    fields.role,
    fields.intent,
  ];
  const completed = required.filter((value) => value.trim().length > 0).length;
  return Math.round((completed / required.length) * 100);
}

function deriveSignalLabel(fields: AccessFormFields): string {
  const completion = computeCompletion(fields);
  const intentLength = fields.intent.trim().length;

  if (completion === 100 && intentLength >= 100) return "Strong signal";
  if (completion >= 80 && intentLength >= 50) return "Usable signal";
  if (completion >= 60) return "Developing signal";
  return "Thin signal";
}

export default function ArtifactGrid() {
  const [fields, setFields] = React.useState<AccessFormFields>({
    name: "",
    email: "",
    organisation: "",
    role: "",
    intent: "",
  });

  const [loading, setLoading] = React.useState(false);
  const [savingDraft, setSavingDraft] = React.useState(false);
  const [submitState, setSubmitState] = React.useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [notice, setNotice] = React.useState("");

  const recaptchaEnabled = hasRecaptchaSiteKey();

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<AccessFormFields>;
      setFields((prev) => ({ ...prev, ...parsed }));
    } catch {
      // ignore malformed draft
    }
  }, []);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fields));
        setSavingDraft(true);
        window.setTimeout(() => setSavingDraft(false), 500);
      } catch {
        // silent by design
      }
    }, AUTO_SAVE_DELAY_MS);

    return () => window.clearTimeout(timeout);
  }, [fields]);

  const completion = React.useMemo(() => computeCompletion(fields), [fields]);
  const signalLabel = React.useMemo(() => deriveSignalLabel(fields), [fields]);

  const handleFieldChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFields((prev) => ({ ...prev, [name]: value }));

      if (submitState !== "idle") {
        setSubmitState("idle");
        setErrorMessage("");
        setNotice("");
      }
    },
    [submitState],
  );

  const clearDraft = React.useCallback(() => {
    if (!window.confirm("Clear this access request and remove the saved draft?")) return;

    const reset = {
      name: "",
      email: "",
      organisation: "",
      role: "",
      intent: "",
    };

    setFields(reset);
    setSubmitState("idle");
    setErrorMessage("");
    setNotice("");
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSubmitState("idle");
    setErrorMessage("");
    setNotice("");

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
          organisation: fields.organisation,
          role: fields.role,
          intent: fields.intent,
          message: fields.intent,
          source: "artifact_grid_v2",
          token,
          metadata: {
            surface: "strategy_room_artifact_grid",
            organisation: fields.organisation,
            role: fields.role,
            completion,
            signalLabel,
          },
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSubmitState("error");
        setErrorMessage(
          typeof json?.error === "string"
            ? json.error
            : "Submission failed. Please try again.",
        );
        return;
      }

      setSubmitState("success");
      setNotice(
        typeof json?.message === "string"
          ? json.message
          : "Request logged. Access review will proceed through the standard triage sequence.",
      );

      setFields({
        name: "",
        email: "",
        organisation: "",
        role: "",
        intent: "",
      });
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error: any) {
      console.error("[ArtifactGrid] Submission error:", error);
      setSubmitState("error");
      setErrorMessage(
        error?.message || "Transmission interrupted. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-[30px] border border-white/[0.08] bg-white/[0.02] shadow-[0_24px_80px_rgba(0,0,0,0.25)] backdrop-blur-sm">
      <div className="border-b border-white/[0.07] px-6 py-5 sm:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#C9A96A]/20 bg-[#C9A96A]/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.22em] text-[#E6D1A1]">
            <Lock className="h-3.5 w-3.5" />
            Artefact Access
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-white/45">
            Intake-first
          </span>
        </div>

        <div className="mt-5 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h3 className="font-serif text-2xl tracking-tight text-white">
              Access the materials
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/62">
              The Strategy Room draws from the Canon and the wider strategic frameworks library.
              Access is reviewed through a governed intake path so that fit, seriousness, and intended use remain clear from the start.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <MetricCard
              icon={Compass}
              label="Completion"
              value={completion}
              tone="bg-[#C9A96A]"
              sublabel="Request coverage"
            />
            <MetricCard
              icon={ShieldCheck}
              label="Signal"
              value={Math.min(100, Math.max(20, fields.intent.trim().length))}
              tone="bg-emerald-400"
              sublabel={signalLabel}
            />
            <MetricCard
              icon={Eye}
              label="Draft status"
              value={savingDraft ? 100 : 85}
              tone="bg-sky-400"
              sublabel={savingDraft ? "Saving..." : "Draft active"}
            />
          </div>
        </div>
      </div>

      <div className="px-6 py-6 sm:px-8">
        {!recaptchaEnabled ? (
          <NoticeCard
            icon={AlertTriangle}
            title="Security notice"
            tone="amber"
            body="reCAPTCHA is not configured in this environment. Intake will still submit where non-production bypass is enabled, but screening is reduced."
          />
        ) : null}

        {submitState === "error" && errorMessage ? (
          <NoticeCard
            icon={AlertTriangle}
            title="Submission error"
            tone="red"
            body={errorMessage}
          />
        ) : null}

        {submitState === "success" && notice ? (
          <NoticeCard
            icon={CheckCircle2}
            title="Request logged"
            tone="emerald"
            body={notice}
          />
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              icon={ShieldCheck}
              label="Principal / Contact Name"
              name="name"
              value={fields.name}
              placeholder="Full name"
              onChange={handleFieldChange}
            />
            <FormField
              icon={Crown}
              label="Role / Capacity"
              name="role"
              value={fields.role}
              placeholder="Founder, Director, Advisor..."
              onChange={handleFieldChange}
            />
            <FormField
              icon={FileStack}
              label="Organisation"
              name="organisation"
              value={fields.organisation}
              placeholder="Organisation or entity name"
              onChange={handleFieldChange}
            />
            <FormField
              icon={Lock}
              label="Institutional Email"
              name="email"
              type="email"
              value={fields.email}
              placeholder="you@organisation.com"
              onChange={handleFieldChange}
            />
          </div>

          <FormField
            icon={Compass}
            label="Nature of Inquiry / Intended Use"
            name="intent"
            isTextarea
            rows={5}
            value={fields.intent}
            placeholder="State what you need, why you need it, and the strategic context for access."
            onChange={handleFieldChange}
          />

          <div className="rounded-[24px] border border-white/[0.08] bg-black/30 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40">
                  Request path
                </div>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Access review follows structured triage. Stronger signal leads to cleaner routing.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={clearDraft}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/[0.08] hover:text-white"
                >
                  Clear
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-[#C9A96A] px-6 py-3.5 text-sm font-medium text-black transition hover:bg-[#E6C27A] disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing request
                    </>
                  ) : (
                    <>
                      Request Inner Circle access
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        <div className="mt-5 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-white/35">
          <FileStack className="h-3.5 w-3.5 text-[#C9A96A]/70" />
          Governed intake. Reviewed access.
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
  sublabel,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone: string;
  sublabel?: string;
}) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-black/30 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
            <Icon className="h-4 w-4 text-white/80" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-white/45">{label}</div>
            {sublabel ? <div className="mt-1 text-xs text-white/50">{sublabel}</div> : null}
          </div>
        </div>
        <div className="text-2xl font-light text-white">{Math.min(value, 100)}%</div>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={cn("h-full rounded-full transition-all duration-500", tone)}
          style={{ width: `${Math.max(6, Math.min(value, 100))}%` }}
        />
      </div>
    </div>
  );
}

function NoticeCard({
  icon: Icon,
  title,
  body,
  tone,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
  tone: "amber" | "red" | "emerald";
}) {
  const toneClasses =
    tone === "amber"
      ? "border-amber-500/20 bg-amber-500/10 text-amber-200/85"
      : tone === "red"
        ? "border-red-500/20 bg-red-500/10 text-red-300"
        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200/90";

  const headingTone =
    tone === "amber"
      ? "text-amber-400"
      : tone === "red"
        ? "text-red-400"
        : "text-emerald-400";

  return (
    <div className={cn("mb-5 flex items-start gap-3 rounded-2xl border p-4", toneClasses)}>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", headingTone)} />
      <div>
        <div className={cn("font-mono text-[10px] uppercase tracking-[0.28em]", headingTone)}>
          {title}
        </div>
        <p className="mt-1 text-sm leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

function FormField({
  icon: Icon,
  label,
  name,
  type = "text",
  placeholder,
  isTextarea = false,
  rows = 4,
  value,
  onChange,
}: {
  icon: React.ElementType;
  label: string;
  name: string;
  type?: string;
  placeholder: string;
  isTextarea?: boolean;
  rows?: number;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) {
  const [focused, setFocused] = React.useState(false);

  return (
    <div className="relative">
      <div className={cn("absolute inset-0 rounded-2xl transition-all", focused && "bg-[#C9A96A]/8")} />
      <div
        className={cn(
          "relative flex gap-4 rounded-2xl border p-5 transition-all",
          focused
            ? "border-[#C9A96A]/35 bg-black/80"
            : "border-white/10 bg-black/50 hover:border-white/20",
        )}
      >
        <div className={cn("rounded-xl p-3 transition-colors", focused ? "text-[#C9A96A]" : "text-zinc-500")}>
          <Icon size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <label className="mb-2 block text-xs font-mono uppercase tracking-widest text-zinc-500">
            {label}
          </label>

          {isTextarea ? (
            <textarea
              required
              name={name}
              rows={rows}
              value={value}
              placeholder={placeholder}
              onChange={onChange}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="min-h-[120px] w-full resize-y bg-transparent text-sm leading-7 text-white placeholder:text-zinc-600 focus:outline-none"
            />
          ) : (
            <input
              required
              type={type}
              name={name}
              value={value}
              placeholder={placeholder}
              onChange={onChange}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="w-full bg-transparent text-sm text-white placeholder:text-zinc-600 focus:outline-none"
            />
          )}
        </div>
      </div>
    </div>
  );
}