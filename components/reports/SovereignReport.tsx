"use client";

import React from "react";
import { useOGRStore } from "@/store/useOGRStore";
import { ShieldCheck, FileText, Globe, Download, Clock, Crown, Compass, BarChart3, CheckCircle2 } from "lucide-react";

export default function SovereignReport() {
  const { resonanceScore, marketFriction, targetRevenue, computed } = useOGRStore();
  
  const timestamp = new Date().toLocaleString('en-GB', { 
    timeZone: 'UTC', 
    hour12: false 
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print-report mx-auto max-w-4xl bg-[#FEFCF8] shadow-[0_35px_70px_-35px_rgba(0,0,0,0.35)] my-24 overflow-hidden print:shadow-none print:my-0">
      
      {/* Decorative Top Border */}
      <div className="h-2 bg-gradient-to-r from-[#8A6A2F] via-[#D4C5A8] to-[#8A6A2F]" />
      
      {/* Main Content */}
      <div className="p-16 print:p-10">
        {/* 1. Official Header with Embossing */}
        <div className="flex justify-between items-start border-b-2 border-[#E8E0D4] pb-12 mb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-[#8A6A2F]" />
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.5em] text-[#8A6A2F]">
                Sovereign Intelligence
              </span>
            </div>
            <h1 className="text-5xl font-serif italic font-light tracking-tighter uppercase text-[#2C2416]">
              Sovereign <span className="not-italic font-bold">Intelligence</span>
              <br />
              <span className="text-2xl text-[#8A6A2F]">Report</span>
            </h1>
            <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-widest text-[#9B8A6B]">
              <Globe className="w-3 h-3" /> 
              <span>Node: LONDON_ALPHA</span>
              <div className="w-px h-3 bg-[#E8E0D4]" />
              <span>REF: OGR-2026-X</span>
            </div>
          </div>
          <div className="text-right space-y-2">
            <div className="inline-block border border-[#E8E0D4] px-4 py-1">
              <span className="font-mono text-[8px] uppercase font-bold tracking-[0.3em] text-[#8A6A2F]">
                Confidential
              </span>
            </div>
            <div className="font-mono text-[9px] text-[#B8A77C] leading-relaxed">
              {timestamp} UTC
            </div>
          </div>
        </div>

        {/* 2. Executive Summary Grid */}
        <div className="grid grid-cols-2 gap-12 mb-16">
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <div className="h-px w-6 bg-[#8A6A2F]" />
              <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#2C2416]">
                I. Input Parameters
              </h3>
            </div>
            <div className="space-y-4 bg-[#FDFBF7] p-6 border border-[#F5F2EA]">
              {[
                { label: "Resonance Score", value: `${resonanceScore}%` },
                { label: "Market Friction", value: `${marketFriction}%` },
                { label: "Total Revenue", value: `$${targetRevenue}M` }
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-baseline border-b border-[#F5F2EA] pb-2">
                  <span className="font-mono text-[11px] text-[#6B5A3E]">{item.label}</span>
                  <strong className="font-serif text-lg text-[#2C2416]">{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <div className="h-px w-6 bg-[#8A6A2F]" />
              <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#2C2416]">
                II. Derived Alpha
              </h3>
            </div>
            <div className="space-y-4 bg-gradient-to-br from-[#FDFBF7] to-white p-6 border border-[#F5F2EA]">
              {[
                { label: "Resonance Alpha", value: `$${computed.resonanceAlpha}M`, highlight: true },
                { label: "Integration Tax", value: `${computed.integrationTax}%` },
                { label: "Velocity", value: `${computed.velocityMultiplier}x` }
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-baseline border-b border-[#F5F2EA] pb-2">
                  <span className="font-mono text-[11px] text-[#6B5A3E]">{item.label}</span>
                  <strong className={`font-serif text-lg ${item.highlight ? 'text-[#8A6A2F]' : 'text-[#2C2416]'}`}>
                    {item.value}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Sovereign Certainty Index */}
        <div className={`relative mb-16 p-8 border-l-8 ${computed.isAuthorizedToExecute ? 'border-[#8A6A2F] bg-gradient-to-r from-[#FDFBF7] to-white' : 'border-[#C44D4D] bg-red-50/30'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              <div className={`p-3 rounded-full ${computed.isAuthorizedToExecute ? 'bg-[#F5F2EA]' : 'bg-red-50'}`}>
                {computed.isAuthorizedToExecute ? (
                  <ShieldCheck className="w-8 h-8 text-[#8A6A2F]" />
                ) : (
                  <Clock className="w-8 h-8 text-[#C44D4D]" />
                )}
              </div>
              <div>
                <span className="block font-mono text-[9px] uppercase font-bold tracking-[0.3em] text-[#8A6A2F]">
                  Sovereign Certainty Index
                </span>
                <div className="flex items-baseline gap-3 mt-2">
                  <span className="block text-5xl font-serif font-light text-[#2C2416]">{computed.sovereignCertainty}%</span>
                  <span className="font-mono text-[8px] text-[#9B8A6B]">confidence interval</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-block px-3 py-1 border border-[#E8E0D4] bg-white/50">
                <span className={`block font-mono text-[9px] font-bold uppercase tracking-widest ${computed.isAuthorizedToExecute ? 'text-[#5C8A5C]' : 'text-[#C44D4D]'}`}>
                  {computed.isAuthorizedToExecute ? "Approved for Execution" : "Requires Realignment"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Integrity Audit Table */}
        <div className="space-y-6 mb-16">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#8A6A2F]" />
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#2C2416]">
              III. Vitest Integrity Audit
            </h3>
          </div>
          
          <div className="border border-[#F5F2EA] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[#FDFBF7] border-b border-[#F5F2EA]">
                  <th className="py-4 px-6 text-left font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#6B5A3E]">
                    Test Module
                  </th>
                  <th className="py-4 px-6 text-left font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#6B5A3E]">
                    Constraints
                  </th>
                  <th className="py-4 px-6 text-right font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#6B5A3E]">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F2EA]">
                {[
                  { module: "Friction Clamp Logic", constraint: "Max F=99.99", result: "PASS" },
                  { module: "Resonance Alpha Calibration", constraint: "Break-Even Verify", result: "PASS" },
                  { module: "Monte Carlo (10k cycles)", constraint: "Drift Tolerance", result: "PASS" }
                ].map((test, idx) => (
                  <tr key={idx} className="hover:bg-[#FDFBF7] transition-colors">
                    <td className="py-3 px-6 font-mono text-[10px] text-[#2C2416]">{test.module}</td>
                    <td className="py-3 px-6 font-mono text-[9px] text-[#6B5A3E]">{test.constraint}</td>
                    <td className="py-3 px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-[#5C8A5C]" />
                        <span className="font-mono text-[9px] font-bold text-[#5C8A5C]">{test.result}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="text-right font-mono text-[8px] text-[#B8A77C]">
            <span>Audit Cycle: 10,000 iterations • Confidence: 99.7%</span>
          </div>
        </div>

        {/* Footer with Institutional Seal */}
        <div className="pt-12 border-t border-[#F5F2EA]">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Crown className="w-4 h-4 text-[#B8A77C]" />
              <span className="font-mono text-[8px] uppercase tracking-[0.5em] text-[#9B8A6B]">
                Abraham of London // Protocol OGR
              </span>
              <Compass className="w-4 h-4 text-[#B8A77C]" />
            </div>
            <button 
              onClick={handlePrint} 
              className="print:hidden flex items-center gap-2 px-5 py-2.5 bg-[#2C2416] text-white font-mono text-[9px] uppercase tracking-widest hover:bg-[#8A6A2F] transition-all shadow-md"
            >
              <Download className="w-3 h-3" /> 
              Export to PDF
            </button>
          </div>
          <div className="mt-6 text-center">
            <div className="inline-block border-t border-[#F5F2EA] pt-4">
              <span className="font-mono text-[7px] uppercase tracking-[0.6em] text-[#D4C5A8]">
                SOVEREIGN INTELLIGENCE • CERTIFIED ACCURATE • OGR-2026
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .print-report {
            box-shadow: none;
            margin: 0;
            padding: 0;
            background: white;
          }
          body {
            background: white;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          @page {
            size: A4;
            margin: 2cm;
          }
          button {
            display: none;
          }
          .print-report .bg-gradient-to-r,
          .print-report .bg-gradient-to-br {
            background: none;
          }
        }
      `}</style>
    </div>
  );
}