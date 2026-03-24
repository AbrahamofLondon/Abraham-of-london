"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Fingerprint, X } from "lucide-react";

interface ToastProps {
  isVisible: boolean;
  reportId?: string;
  onClose: () => void;
}

export function OGRSuccessToast({ isVisible, reportId, onClose }: ToastProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed bottom-8 right-8 z-[100] w-80 bg-black border border-[#8A6A2F] p-6 shadow-[0_20px_50px_rgba(138,106,47,0.2)]"
        >
          <button onClick={onClose} className="absolute top-2 right-2 text-neutral-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="p-2 bg-[#8A6A2F]/10 rounded-full">
              <CheckCircle2 className="w-5 h-5 text-[#8A6A2F]" />
            </div>
            <div className="space-y-1">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A6A2F]">
                Archive Success
              </h4>
              <p className="text-xs font-bold text-white uppercase tracking-tight">
                Report Committed to Ledger
              </p>
              {reportId && (
                <div className="mt-3 pt-3 border-t border-neutral-800 flex items-center gap-2">
                  <Fingerprint className="w-3 h-3 text-neutral-500" />
                  <span className="text-[8px] font-mono text-neutral-400 uppercase">
                    Ref: {reportId}
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}