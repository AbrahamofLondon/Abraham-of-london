"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Shield,
} from "lucide-react";

type FormState = {
  name: string;
  slug: string;
  sector: string;
  description: string;
};

const INITIAL_FORM: FormState = {
  name: "",
  slug: "",
  sector: "",
  description: "",
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function NewOrganisationPage() {
  const [form, setForm] = React.useState<FormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;

    setForm((prev) => {
      if (name === "name") {
        const nextSlug = prev.slug.trim().length === 0 ? slugify(value) : prev.slug;
        return {
          ...prev,
          name: value,
          slug: nextSlug,
        };
      }

      if (name === "slug") {
        return {
          ...prev,
          slug: slugify(value),
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });

    if (serverError) setServerError(null);
    if (successMessage) setSuccessMessage(null);
  }

  function validate(): string | null {
    if (!form.name.trim()) return "Organisation name is required.";
    if (!form.slug.trim()) return "Organisation slug is required.";
    if (!form.sector.trim()) return "Sector is required.";
    if (form.description.trim().length < 20) {
      return "Description is too thin. Give the organisation a proper profile.";
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const error = validate();
    if (error) {
      setServerError(error);
      return;
    }

    setIsSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/admin/organisations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim(),
          sector: form.sector.trim(),
          description: form.description.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error || data?.message || "Failed to create organisation."
        );
      }

      setSuccessMessage("Organisation created successfully.");

      const nextId = data?.organisation?.id ?? data?.id ?? null;

      if (nextId) {
        window.location.href = `/admin/organisations/${nextId}`;
        return;
      }

      window.location.href = "/admin/organisations";
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Failed to create organisation."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/admin/organisations"
            className="inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-white/80"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Organisations
          </Link>

          <div className="inline-flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-emerald-300">
              Admin Surface
            </span>
          </div>
        </div>

        <div className="overflow-hidden border border-white/10 bg-zinc-950/70">
          <div className="border-b border-white/10 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-800 px-8 py-8 text-white">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded bg-white/10">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/60">
                  Enterprise Registry
                </div>
                <h1 className="mt-2 font-serif text-3xl tracking-tight">
                  New Organisation
                </h1>
                <p className="mt-2 text-sm text-white/70">
                  Create a clean registry node instead of smuggling campaign logic
                  into the wrong route.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-[11px] font-mono uppercase tracking-[0.18em] text-white/40">
                  Organisation Name
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Alomarada Ltd"
                  className="w-full border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-500/30 placeholder:text-white/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-mono uppercase tracking-[0.18em] text-white/40">
                  Slug
                </label>
                <input
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  placeholder="alomarada-ltd"
                  className="w-full border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-500/30 placeholder:text-white/30"
                />
                <p className="mt-2 text-xs text-white/40">
                  Lowercase URL-safe identifier. Auto-derived from the name unless overridden.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-mono uppercase tracking-[0.18em] text-white/40">
                  Sector
                </label>
                <input
                  name="sector"
                  value={form.sector}
                  onChange={handleChange}
                  placeholder="Advisory, infrastructure, governance..."
                  className="w-full border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-500/30 placeholder:text-white/30"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-[11px] font-mono uppercase tracking-[0.18em] text-white/40">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Provide a concise but real description of the organisation, its mandate, and its operating profile."
                  className="w-full border border-white/10 bg-black/40 px-4 py-3 text-sm leading-7 text-white outline-none transition focus:border-amber-500/30 placeholder:text-white/30"
                />
              </div>
            </div>

            {serverError ? (
              <div className="mt-6 border border-red-500/20 bg-red-500/10 px-4 py-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-red-400" />
                  <p className="text-sm text-red-300">{serverError}</p>
                </div>
              </div>
            ) : null}

            {successMessage ? (
              <div className="mt-6 border border-emerald-500/20 bg-emerald-500/10 px-4 py-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                  <p className="text-sm text-emerald-300">{successMessage}</p>
                </div>
              </div>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-6 text-white/40">
                This route is for creating an organisation node. If you meant
                &ldquo;create campaign for a specific organisation,&rdquo; that belongs under a
                dynamic organisation route, not here.
              </p>

              <button
                type="submit"
                disabled={isSubmitting}
                className={cx(
                  "inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-mono transition",
                  isSubmitting
                    ? "cursor-not-allowed bg-white/10 text-white/40"
                    : "border border-amber-500/20 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                )}
              >
                {isSubmitting ? "Creating..." : "Create Organisation"}
                {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
