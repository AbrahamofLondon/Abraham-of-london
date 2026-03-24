"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createOrganisationSchema } from "@/lib/alignment/enterprise-schemas";
import { 
  Building2, 
  Globe, 
  ChevronRight, 
  Loader2, 
  AlertCircle,
  CheckCircle2
} from "lucide-react";

type OrgFormData = {
  name: string;
  slug: string;
  sector?: string | null;
  sizeBand?: string | null;
  region?: string | null;
};

export default function NewOrganisationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OrgFormData>({
    resolver: zodResolver(createOrganisationSchema),
    defaultValues: {
      name: "",
      slug: "",
    }
  });

  // Automatically generate slug from name
  const orgName = watch("name");
  React.useEffect(() => {
    if (orgName) {
      const generatedSlug = orgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setValue("slug", generatedSlug, { shouldValidate: true });
    }
  }, [orgName, setValue]);

  const onSubmit = async (data: OrgFormData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await fetch("/api/alignment/enterprise/organisations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Submission failed");

      router.push(`/admin/organisations/${result.organisation.id}`);
    } catch (err: any) {
      setServerError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#F9F7F2] p-6 lg:p-20 font-mono">
      <div className="max-w-2xl mx-auto">
        
        {/* Header Section */}
        <header className="mb-12 border-b border-white/10 pb-10">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-5 h-5 text-[#8A6A2F]" />
            <span className="text-[10px] uppercase tracking-[0.5em] text-[#8A6A2F] font-bold">
              Entity Provisioning // OGR-CORE
            </span>
          </div>
          <h1 className="text-4xl font-serif italic text-white uppercase tracking-tight">
            Register New <span className="not-italic font-sans font-black">Organisation</span>
          </h1>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          
          {/* Main Identity Group */}
          <div className="bg-white/[0.02] border border-white/5 p-8 space-y-8">
            <h2 className="text-[10px] text-[#8A6A2F] font-bold tracking-widest uppercase flex items-center gap-2">
              <ChevronRight className="w-3 h-3" /> Identity Matrix
            </h2>

            <div className="space-y-6">
              <FormField label="Organisation Name" error={errors.name?.message}>
                <input
                  {...register("name")}
                  className="w-full bg-black/40 border border-white/10 p-4 focus:border-[#8A6A2F] outline-none transition-all font-sans text-white"
                  placeholder="e.g. Sovereign Analytics Ltd"
                />
              </FormField>

              <FormField label="URL Slug (System ID)" error={errors.slug?.message}>
                <div className="relative">
                  <input
                    {...register("slug")}
                    className="w-full bg-black/60 border border-white/10 p-4 pl-10 focus:border-[#8A6A2F] outline-none transition-all font-mono text-[11px] text-[#8A6A2F]"
                  />
                  <Globe className="absolute left-3 top-4 w-4 h-4 text-neutral-600" />
                </div>
              </FormField>
            </div>
          </div>

          {/* Categorization Group */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField label="Industrial Sector" error={errors.sector?.message}>
              <input
                {...register("sector")}
                className="w-full bg-white/[0.03] border border-white/10 p-3 focus:border-[#8A6A2F] outline-none transition-all"
                placeholder="e.g. Finance"
              />
            </FormField>

            <FormField label="Operational Region" error={errors.region?.message}>
              <input
                {...register("region")}
                className="w-full bg-white/[0.03] border border-white/10 p-3 focus:border-[#8A6A2F] outline-none transition-all"
                placeholder="e.g. EMEA"
              />
            </FormField>
          </div>

          {/* Submission Feedback */}
          {serverError && (
            <div className="p-4 bg-red-900/10 border border-red-500/50 flex items-center gap-3 text-red-500 text-xs">
              <AlertCircle className="w-4 h-4" />
              <span>PROTOCOL ERROR: {serverError}</span>
            </div>
          )}

          <div className="pt-6 border-t border-white/10 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex items-center gap-4 px-10 py-4 bg-[#8A6A2F] text-white text-[11px] uppercase font-bold tracking-[0.3em] hover:bg-[#A68B56] disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {isSubmitting ? "Processing..." : "Commit Entity"}
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

/** ATOMIC UI HELPER **/
function FormField({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="space-y-2">
      <label className="block text-[9px] uppercase tracking-[0.2em] text-neutral-500 font-bold">
        {label}
      </label>
      {children}
      {error && (
        <span className="block text-[10px] text-red-500 italic lowercase tracking-tight">
          {error}
        </span>
      )}
    </div>
  );
}