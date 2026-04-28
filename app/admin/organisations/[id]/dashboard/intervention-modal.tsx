"use client";

import React, { useState } from "react";
import {
  X,
  ShieldAlert,
  Zap,
  ChevronRight,
  Clock,
  Target,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { deployIntervention } from "@/app/actions/deploy-intervention";

interface InterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  domain: string;
  score: number;
  organisationId: string;
}

export function InterventionModal({
  isOpen,
  onClose,
  domain,
  score,
  organisationId,
}: InterventionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [selectedUrgency, setSelectedUrgency] = useState<"immediate" | "scheduled">(
    "immediate"
  );

  const isCritical = score < 60;

  const handleDeploy = async () => {
    setIsSubmitting(true);
    setStatus("idle");

    try {
      const result = await deployIntervention({
        organisationId,
        domain,
        baselineScore: score,
        urgency: selectedUrgency,
      });

      if (result.success) {
        setStatus("success");
        setTimeout(() => {
          onClose();
          setStatus("idle");
        }, 1800);
      } else {
        setStatus("error");
        console.error(result.error);
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden border border-neutral-200"
        >
          <div
            className={`p-8 flex justify-between items-start text-white transition-colors duration-500 ${
              isCritical ? "bg-red-600" : "bg-[#8A6A2F]"
            }`}
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert size={18} className="text-white/80" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">
                  Sovereign Protocol // Execution v4.2
                </span>
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">
                {isCritical ? "Recovery" : "Optimization"} : {domain.replace(/_/g, " ")}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-8 space-y-8">
            <AnimatePresence>
              {status === "success" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute inset-x-0 top-[120px] bottom-0 bg-white z-10 flex flex-col items-center justify-center space-y-4"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight">
                    Deployment Complete
                  </h3>
                  <p className="text-sm text-neutral-500 font-medium">
                    Correction nodes have been successfully broadcast.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-6 items-center p-5 bg-neutral-50 border border-neutral-100 rounded-xl">
              <div className="text-center border-r border-neutral-200 pr-6">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
                  Variance
                </p>
                <p
                  className={`text-2xl font-black ${
                    isCritical ? "text-red-600" : "text-neutral-900"
                  }`}
                >
                  {Math.round(100 - score)}%
                </p>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-600 leading-relaxed">
                  Initializing this framework generates{" "}
                  <span className="font-bold text-neutral-900">
                    3 structural correction nodes
                  </span>
                  . Targeted impact: reducing operational friction in the{" "}
                  <span className="font-bold text-neutral-900">{domain}</span> domain.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 flex items-center gap-2">
                <Target size={14} className="text-[#8A6A2F]" /> Scheduled Corrections
              </h4>
              <div className="grid gap-2">
                <InterventionStep
                  title="Structural Audit"
                  description="Cross-reference current allocation with 2026 strategic brief."
                />
                <InterventionStep
                  title="Decision Logic Reset"
                  description="Standardize approval review points for non-consensus expenditures."
                />
                <InterventionStep
                  title="Sovereign Reporting"
                  description="Integrate real-time OGR-IV metrics for executive review."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <UrgencyOption
                active={selectedUrgency === "immediate"}
                onClick={() => setSelectedUrgency("immediate")}
                icon={<Zap size={20} />}
                label="Immediate"
                sub="Deploy nodes now"
              />
              <UrgencyOption
                active={selectedUrgency === "scheduled"}
                onClick={() => setSelectedUrgency("scheduled")}
                icon={<Clock size={20} />}
                label="Scheduled"
                sub="Review for Q2/Q3"
              />
            </div>

            <div className="pt-4 flex gap-4 items-center">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-4 text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-neutral-700 transition-colors disabled:opacity-50"
              >
                Cancel Protocol
              </button>
              <button
                onClick={handleDeploy}
                disabled={isSubmitting || status === "success"}
                className={`flex-[2] py-4 rounded-xl text-white text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all shadow-lg ${
                  isCritical
                    ? "bg-red-600 hover:bg-red-700 shadow-red-100"
                    : "bg-neutral-900 hover:bg-black shadow-neutral-200"
                } disabled:opacity-70`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deploying Protocol...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Confirm & Deploy Framework
                  </>
                )}
              </button>
            </div>

            {status === "error" && (
              <div className="flex items-center gap-2 text-red-600 justify-center mt-4">
                <AlertTriangle size={14} />
                <p className="text-[10px] font-black uppercase tracking-widest">
                  Protocol injection failed. Retry.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function InterventionStep({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="group flex items-center gap-4 p-4 border border-neutral-100 rounded-lg bg-neutral-50/30 hover:bg-white hover:shadow-md hover:border-neutral-200 transition-all">
      <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-[#8A6A2F] group-hover:text-white transition-colors">
        <ChevronRight size={14} />
      </div>
      <div>
        <h5 className="text-[11px] font-black uppercase tracking-tight text-neutral-900 leading-none mb-1">
          {title}
        </h5>
        <p className="text-[10px] text-neutral-500 font-medium leading-tight">
          {description}
        </p>
      </div>
    </div>
  );
}

function UrgencyOption({
  active,
  onClick,
  icon,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 group ${
        active
          ? "border-[#8A6A2F] bg-amber-50/50 shadow-inner"
          : "border-neutral-100 hover:border-neutral-200 bg-white"
      }`}
    >
      <div
        className={`transition-colors ${
          active
            ? "text-[#8A6A2F]"
            : "text-neutral-300 group-hover:text-neutral-400"
        }`}
      >
        {icon}
      </div>
      <div className="text-left">
        <p
          className={`text-xs font-black uppercase ${
            active ? "text-neutral-900" : "text-neutral-500"
          }`}
        >
          {label}
        </p>
        <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-tighter">
          {sub}
        </p>
      </div>
    </button>
  );
}
