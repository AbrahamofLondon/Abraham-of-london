export const dynamic = "force-dynamic";
"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCampaignSchema } from "@/lib/alignment/enterprise-schemas";
import { 
  Send, 
  Users, 
  Target, 
  Loader2, 
  Plus, 
  X,
  Zap
} from "lucide-react";

// Define proper type for the params
type PageProps = {
  params: {
    id: string;
  };
};

export default function NewCampaignPage({ params }: PageProps) {
  // Use dynamic import or direct reference
  const router = require("next/navigation").useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emails, setEmails] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: {
      organisationId: params.id,
      title: "",
      cadenceType: "ad_hoc",
    }
  });

  const addEmail = () => {
    if (currentEmail && /^\S+@\S+\.\S+$/.test(currentEmail) && !emails.includes(currentEmail)) {
      setEmails([...emails, currentEmail]);
      setCurrentEmail("");
    }
  };

  const removeEmail = (email: string) => {
    setEmails(emails.filter(e => e !== email));
  };

  const onSubmit = async (data: any) => {
    if (emails.length === 0) {
      alert("Please add at least one participant.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/alignment/enterprise/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          participants: emails.map(email => ({ email }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to deploy campaign");
      }
      
      router.push(`/admin/organisations/${params.id}`);
      router.refresh();
    } catch (err) {
      console.error("Campaign creation error:", err);
      alert(err instanceof Error ? err.message : "Failed to create campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#F9F7F2] p-6 lg:p-20 font-mono">
      <div className="max-w-3xl mx-auto">
        
        <header className="mb-12 border-b border-white/10 pb-10">
          <div className="flex items-center gap-3 mb-4 text-[#8A6A2F]">
            <Zap className="w-5 h-5" />
            <span className="text-[10px] uppercase tracking-[0.5em] font-bold">Campaign Deployment // OGR-INIT</span>
          </div>
          <h1 className="text-4xl font-serif italic text-white uppercase tracking-tight">
            Launch <span className="not-italic font-sans font-black">Alignment Audit</span>
          </h1>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
          
          {/* Campaign Parameters */}
          <div className="bg-white/[0.02] border border-white/5 p-8 space-y-8">
            <h2 className="text-[10px] text-[#8A6A2F] font-bold tracking-widest uppercase flex items-center gap-2">
              <Target className="w-3 h-3" /> Mission Parameters
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-[9px] uppercase tracking-widest text-neutral-500 mb-2 block">Campaign Title</label>
                <input 
                  {...register("title")}
                  className="w-full bg-black/40 border border-white/10 p-4 focus:border-[#8A6A2F] outline-none transition-all font-sans text-white"
                  placeholder="e.g. Q3 Strategic Integrity Audit"
                />
                {errors.title && <p className="text-red-500 text-[10px] mt-1">{errors.title.message as string}</p>}
              </div>

              <div>
                <label className="text-[9px] uppercase tracking-widest text-neutral-500 mb-2 block">Cadence</label>
                <select 
                  {...register("cadenceType")}
                  className="w-full bg-black/40 border border-white/10 p-4 focus:border-[#8A6A2F] outline-none transition-all text-white"
                >
                  <option value="ad_hoc">Ad Hoc</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] uppercase tracking-widest text-neutral-500 mb-2 block">Close Date (Optional)</label>
                <input 
                  type="date"
                  {...register("closesAt")}
                  className="w-full bg-black/40 border border-white/10 p-4 focus:border-[#8A6A2F] outline-none transition-all text-white"
                />
              </div>
            </div>
          </div>

          {/* Participant Intake */}
          <div className="bg-white/[0.02] border border-white/5 p-8 space-y-8">
            <h2 className="text-[10px] text-[#8A6A2F] font-bold tracking-widest uppercase flex items-center gap-2">
              <Users className="w-3 h-3" /> Target Population
            </h2>

            <div className="space-y-4">
              <div className="flex gap-2">
                <input 
                  value={currentEmail}
                  onChange={(e) => setCurrentEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addEmail();
                    }
                  }}
                  className="flex-1 bg-black/40 border border-white/10 p-4 focus:border-[#8A6A2F] outline-none transition-all text-white"
                  placeholder="Enter participant email..."
                  type="email"
                />
                <button 
                  type="button" 
                  onClick={addEmail}
                  className="px-6 bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-[#8A6A2F]"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-4">
                {emails.map((email) => (
                  <div key={email} className="flex items-center gap-2 px-3 py-1 bg-[#8A6A2F]/10 border border-[#8A6A2F]/30 text-[#8A6A2F] text-[10px] font-bold">
                    {email}
                    <button type="button" onClick={() => removeEmail(email)} className="hover:text-white transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {emails.length === 0 && <p className="text-[10px] text-neutral-600 italic">No participants added yet.</p>}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-4 px-10 py-4 bg-[#8A6A2F] text-white text-[11px] uppercase font-bold tracking-[0.3em] hover:bg-[#A68B56] disabled:opacity-50 transition-all"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isSubmitting ? "Deploying..." : "Initiate Audit"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}