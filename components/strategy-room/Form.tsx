/* components/strategy-room/Form.tsx — HARRODS / McKINSEY GRADE (pipeline-aligned) */
"use client";

import * as React from "react";
import { motion, type Transition } from "framer-motion";
import {
  ArrowRight,
  Loader2,
  Shield,
  Lock,
  Eye,
  Sparkles,
  CheckCircle2,
  FileSignature,
  Building2,
  Target,
  Compass,
  AlertTriangle,
} from "lucide-react";

type SubmitState = "idle" | "success" | "error";

type FormState = {
  name: string;
  email: string;
  organisation: string;
  intent: string;
};

type ApiSuccess = {
  ok: true;
  message: string;
  referenceId: string;
  priorityStatus?: string | null;
  warning?: string;
};

type ApiFailure = {
  ok: false;
  error: string;
  details?: unknown;
};

const TRANSITION: Transition = {
  duration: 0.6,
  ease: [0.16, 1, 0.3, 1] as unknown as Transition["ease"],
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
    console.warn("[StrategyRoomForm] reCAPTCHA unavailable; continuing without token.", error);
    return null;
  }
}

function validateEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateForm(state: FormState): string | null {
  if (!state.name.trim() || !state.email.trim() || !state.organisation.trim() || !state.intent.trim()) {
    return "Incomplete institutional data.";
  }

  if (!validateEmail(state.email.trim())) {
    return "A valid institutional email is required.";
  }

  if (state.intent.trim().length < 12) {
    return "Strategic intent is too brief.";
  }

  return null;
}

const FormField = ({
  icon: Icon,
  label,
  name,
  type = "text",
  required = true,
  placeholder,
  rows,
  isTextarea = false,
  value,
  onChange,
}: {
  icon: any;
  label: string;
  name: keyof FormState;
  type?: string;
  required?: boolean;
  placeholder: string;
  rows?: number;
  isTextarea?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) => {
  const [focused, setFocused] = React.useState(false);

  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div
        className={`absolute inset-0 rounded-2xl transition-all duration-500 ${
          focused
            ? "bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/20 blur-xl"
            : "bg-transparent"
        }`}
      />

      <div
        className={`relative flex items-start gap-4 rounded-2xl border p-6 transition-all duration-500 backdrop-blur-sm ${
          focused
            ? "border-amber-500/40 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-500/5 shadow-[0_0_40px_-12px_rgba(245,158,11,0.3)]"
            : "border-white/5 bg-black/40 hover:border-white/10 hover:bg-black/60"
        }`}
      >
        <div
          className={`rounded-xl border p-3 transition-all duration-500 ${
            focused
              ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
              : "border-white/5 bg-white/[0.02] text-zinc-600 group-hover:text-zinc-400"
          }`}
        >
          <Icon size={18} />
        </div>

        <div className="flex-1 space-y-2">
          <label
            className={`block text-[9px] font-mono uppercase tracking-[0.3em] transition-colors duration-500 ${
              focused ? "text-amber-400" : "text-zinc-600"
            }`}
          >
            {label}
          </label>

          {isTextarea ? (
            <textarea
              name={name}
              required={required}
              rows={rows || 4}
              placeholder={placeholder}
              value={value}
              onChange={onChange}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="w-full resize-none bg-transparent text-sm font-light text-white outline-none placeholder:text-zinc-800"
            />
          ) : (
            <input
              type={type}
              name={name}
              required={required}
              placeholder={placeholder}
              value={value}
              onChange={onChange}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="w-full bg-transparent text-sm font-light text-white outline-none placeholder:text-zinc-800"
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default function StrategyRoomForm() {
  const [loading, setLoading] = React.useState(false);
  const [submitState, setSubmitState] = React.useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [successMessage, setSuccessMessage] = React.useState("");
  const [warningMessage, setWarningMessage] = React.useState("");
  const [referenceId, setReferenceId] = React.useState("");
  const [formState, setFormState] = React.useState<FormState>({
    name: "",
    email: "",
    organisation: "",
    intent: "",
  });

  const recaptchaEnabled = hasRecaptchaSiteKey();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const resetMessages = () => {
    setSubmitState("idle");
    setErrorMessage("");
    setSuccessMessage("");
    setWarningMessage("");
    setReferenceId("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    resetMessages();

    const validationError = validateForm(formState);
    if (validationError) {
      setSubmitState("error");
      setErrorMessage(validationError);
      return;
    }

    setLoading(true);

    try {
      const token = await getSafeRecaptchaToken("strategy_room_intake");

      const res = await fetch("/api/strategy-room/enrol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formState.name.trim(),
          fullName: formState.name.trim(),
          email: formState.email.trim(),
          organisation: formState.organisation.trim(),
          intent: formState.intent.trim(),
          message: formState.intent.trim(),
          source: "strategy_room_form",
          token,
          metadata: {
            surface: "strategy_room_form",
            organisation: formState.organisation.trim(),
          },
        }),
      });

      const json = (await res.json().catch(() => ({}))) as ApiSuccess | ApiFailure;

      if (!res.ok || !json || !("ok" in json) || !json.ok) {
        setSubmitState("error");
        setErrorMessage(
          typeof (json as ApiFailure)?.error === "string"
            ? (json as ApiFailure).error
            : "Submission failed. Please try again."
        );
        return;
      }

      setSubmitState("success");
      setSuccessMessage(
        typeof json.message === "string"
          ? json.message
          : "Your inquiry has been received by the Directorate."
      );
      setReferenceId(json.referenceId || "");
      setWarningMessage(json.warning || "");
      setFormState({
        name: "",
        email: "",
        organisation: "",
        intent: "",
      });
      (e.currentTarget as HTMLFormElement).reset();
    } catch (err: any) {
      console.error("[StrategyRoomForm] Submission error:", err);
      setSubmitState("error");
      setErrorMessage(err?.message || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitState === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={TRANSITION}
        className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-black to-amber-500/5 p-12"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(245,158,11,0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(245,158,11,0.05),transparent_70%)]" />

        <div className="relative space-y-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex rounded-full border border-amber-500/30 bg-gradient-to-br from-amber-500/20 to-amber-500/5 p-4"
          >
            <CheckCircle2 className="h-12 w-12 text-amber-400" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <h3 className="font-serif text-3xl text-white">Intelligence Request Logged</h3>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-zinc-400">
              {successMessage ||
                "Your inquiry has been received by the Directorate. A member of our strategic team will respond within 24–48 hours."}
            </p>
            {referenceId ? (
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-amber-400/80">
                Reference: {referenceId}
              </div>
            ) : null}
            {warningMessage ? (
              <div className="mx-auto max-w-lg rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-left text-sm leading-relaxed text-amber-200/85">
                {warningMessage}
              </div>
            ) : null}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-8 pt-8 text-[10px] font-mono uppercase tracking-widest text-zinc-700"
          >
            <span className="flex items-center gap-2">
              <Shield size={12} className="text-amber-500/50" /> Intake Logged
            </span>
            <span className="flex items-center gap-2">
              <Lock size={12} className="text-amber-500/50" /> Review Queued
            </span>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={TRANSITION}
      className="relative"
    >
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-500/5 via-transparent to-amber-500/5 blur-3xl" />
      <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.05),transparent_70%)]" />

      <form onSubmit={handleSubmit} className="relative space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={TRANSITION}
          className="mb-12 text-center"
        >
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-2">
            <Sparkles size={14} className="text-amber-400" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400">
              Institutional Intake
            </span>
          </div>

          <h2 className="mb-4 font-serif text-4xl tracking-tight text-white">
            Strategic <span className="italic text-amber-400">Inquiry</span>
          </h2>

          <p className="mx-auto max-w-lg text-sm leading-relaxed text-zinc-500">
            Submit your institutional profile for preliminary assessment by the Directorate.
          </p>
        </motion.div>

        {!recaptchaEnabled ? (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-200/80">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-amber-400">
                Security Notice
              </div>
              <p className="mt-1 text-sm leading-relaxed">
                reCAPTCHA is not configured in this environment. Submission will only proceed where
                non-production bypass is enabled.
              </p>
            </div>
          </div>
        ) : null}

        {submitState === "error" && errorMessage ? (
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-red-400">
                Submission Error
              </div>
              <p className="mt-1 text-sm leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          <FormField
            icon={FileSignature}
            label="Principal Identifier"
            name="name"
            placeholder="FULL INSTITUTIONAL NAME"
            value={formState.name}
            onChange={handleChange}
          />

          <FormField
            icon={Building2}
            label="Institutional Email"
            name="email"
            type="email"
            placeholder="CONTACT@DOMAIN.EXT"
            value={formState.email}
            onChange={handleChange}
          />

          <FormField
            icon={Target}
            label="Organisation / Affiliation"
            name="organisation"
            placeholder="ENTITY / PRACTICE / HOUSE"
            value={formState.organisation}
            onChange={handleChange}
          />

          <FormField
            icon={Compass}
            label="Nature of Inquiry"
            name="intent"
            isTextarea
            rows={4}
            placeholder="STRATEGIC INTENT / CONTEXT / REQUIREMENTS"
            value={formState.intent}
            onChange={handleChange}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="pt-8"
        >
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 p-[2px] transition-all duration-500 hover:shadow-[0_0_40px_-8px_rgba(245,158,11,0.5)] disabled:cursor-not-allowed disabled:opacity-80"
          >
            <div className="relative flex items-center justify-center gap-4 rounded-2xl bg-black px-8 py-5 transition-all duration-500 group-hover:bg-transparent">
              {loading ? (
                <>
                  <Loader2 className="animate-spin text-amber-400" size={20} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-400">
                    Encrypting Transmission...
                  </span>
                </>
              ) : (
                <>
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white transition-colors group-hover:text-black">
                    Submit Strategic Inquiry
                  </span>
                  <ArrowRight
                    size={16}
                    className="text-amber-400 transition-all duration-300 group-hover:translate-x-2 group-hover:text-black"
                  />
                </>
              )}
            </div>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-6 pt-8 text-[9px] font-mono uppercase tracking-widest text-zinc-800"
        >
          <span className="flex items-center gap-2">
            <Lock size={10} className="text-zinc-700" /> Intake Secured
          </span>
          <span className="h-4 w-px bg-zinc-800" />
          <span className="flex items-center gap-2">
            <Eye size={10} className="text-zinc-700" /> Directorate Reviewed
          </span>
        </motion.div>
      </form>
    </motion.div>
  );
}