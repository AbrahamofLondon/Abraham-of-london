"use client";

import React, { useState, useEffect } from "react";
import { ENTERPRISE_ALIGNMENT_QUESTIONS } from "@/lib/alignment/enterprise-checklist";
import { Loader2, CheckCircle2, ShieldAlert, ChevronRight, ChevronLeft } from "lucide-react";

export default function PublicAssessmentPage({ params }: { params: { token: string } }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const questions = ENTERPRISE_ALIGNMENT_QUESTIONS;
  const currentQuestion = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  const handleAnswer = (value: boolean) => {
    setAnswers({ ...answers, [currentQuestion.id]: value });
    if (step < questions.length - 1) {
      setStep(step + 1);
    }
  };

  const submitAssessment = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/alignment/enterprise/assessments", {
        method: "POST",
        body: JSON.stringify({ token: params.token, answers }),
      });
      if (res.ok) setIsComplete(true);
    } catch (err) {
      alert("Submission failed. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isComplete) return <SuccessState />;

  return (
    <div className="min-h-screen bg-[#050505] text-[#F9F7F2] font-mono flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full space-y-12">
        
        {/* Progress Header */}
        <header className="space-y-4 text-center">
          <div className="text-[10px] uppercase tracking-[0.4em] text-[#8A6A2F] font-bold">
            OGR Stress Test // Question {step + 1} of {questions.length}
          </div>
          <div className="h-1 w-full bg-white/5 overflow-hidden">
            <div 
              className="h-full bg-[#8A6A2F] transition-all duration-300" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </header>

        {/* Question Card */}
        <div className="bg-white/[0.02] border border-white/5 p-10 min-h-[300px] flex flex-col justify-center items-center text-center space-y-8">
           <p className="text-[10px] text-neutral-500 uppercase tracking-widest italic">
             Domain: {currentQuestion.domain.replace(/_/g, ' ')}
           </p>
           <h2 className="text-xl md:text-2xl font-serif italic text-white leading-relaxed">
             "{currentQuestion.text}"
           </h2>
        </div>

        {/* Response Controls */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleAnswer(true)}
            className="py-6 border border-white/10 hover:border-[#8A6A2F] hover:bg-[#8A6A2F]/10 transition-all uppercase text-[11px] font-bold tracking-widest text-white flex flex-col items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5 text-[#8A6A2F]" />
            Accurate
          </button>
          <button
            onClick={() => handleAnswer(false)}
            className="py-6 border border-white/10 hover:border-red-900/50 hover:bg-red-900/10 transition-all uppercase text-[11px] font-bold tracking-widest text-neutral-400 flex flex-col items-center gap-2"
          >
            <ShieldAlert className="w-5 h-5 text-red-900" />
            Inaccurate
          </button>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <button 
            disabled={step === 0}
            onClick={() => setStep(step - 1)}
            className="text-[9px] uppercase tracking-widest text-neutral-600 hover:text-white disabled:opacity-0 flex items-center gap-1"
          >
            <ChevronLeft className="w-3 h-3" /> Back
          </button>
          
          {step === questions.length - 1 && Object.keys(answers).length === questions.length && (
            <button 
              onClick={submitAssessment}
              disabled={isSubmitting}
              className="bg-white text-black px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-[#8A6A2F] hover:text-white transition-all flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="animate-spin w-3 h-3" /> : "Commit Assessment"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SuccessState() {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono flex items-center justify-center p-6 text-center">
      <div className="max-w-sm space-y-6">
        <CheckCircle2 className="w-12 h-12 text-[#8A6A2F] mx-auto" />
        <h1 className="text-2xl font-serif italic uppercase tracking-tighter">Transmission Successful</h1>
        <p className="text-[10px] text-neutral-500 uppercase leading-relaxed tracking-widest">
          Your alignment data has been synthesized. Your contribution is vital to the organizational OGR curve. 
          You may now close this window.
        </p>
      </div>
    </div>
  );
}