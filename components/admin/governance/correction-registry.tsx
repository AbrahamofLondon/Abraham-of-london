/* components/admin/governance/correction-registry.tsx */
'use client';

import React, { useState } from 'react';
import { CheckCircle2, Clock, Activity, ShieldCheck, ArrowUpRight, XCircle } from 'lucide-react';
import { liquidateProtocol } from '@/app/actions/governance';

export interface LiquidationNode {
  id: string;           // Display ID (sliced)
  internalId: string;  // Full database ID for API calls
  domain: string;
  action: string;
  recovery: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'LIQUIDATED';
}

interface CorrectionRegistryProps {
  nodes: LiquidationNode[];
  campaignId: string;
  onLiquidation?: () => void;
}

export function CorrectionRegistry({ nodes, campaignId, onLiquidation }: CorrectionRegistryProps) {
  const [pendingNodeId, setPendingNodeId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLiquidation = async (internalId: string) => {
    if (isProcessing) return;
    
    setPendingNodeId(internalId);
    setIsProcessing(true);
    
    try {
      const result = await liquidateProtocol(internalId, campaignId);
      if (result.success) {
        onLiquidation?.();
      } else {
        alert(result.error || 'Failed to liquidate correction node.');
      }
    } catch (error) {
      alert('An error occurred while processing the liquidation.');
    } finally {
      setPendingNodeId(null);
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'LIQUIDATED':
        return <CheckCircle2 className="w-3 h-3 text-emerald-500" />;
      case 'IN_PROGRESS':
        return <Clock className="w-3 h-3 text-amber-500" />;
      case 'OPEN':
        return <XCircle className="w-3 h-3 text-red-500" />;
      default:
        return <ShieldCheck className="w-3 h-3 text-neutral-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'LIQUIDATED':
        return 'Resolved';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'OPEN':
        return 'Open';
      default:
        return status;
    }
  };

  if (!nodes || nodes.length === 0) {
    return (
      <div className="bg-white border border-neutral-200 shadow-sm p-12 text-center">
        <ShieldCheck className="w-10 h-10 text-neutral-200 mx-auto mb-4" />
        <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-400">
          Registry Clear // No Active Corrections
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 shadow-sm font-sans overflow-hidden">
      <div className="px-8 py-6 bg-neutral-900 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Activity className="w-4 h-4 text-neutral-400" />
          <h3 className="text-[9px] font-mono uppercase tracking-widest text-neutral-300">
            Correction Registry // Energy Recovery Log
          </h3>
        </div>
        <span className="text-[8px] font-mono text-neutral-500 uppercase">OGR-L42</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50/30">
              <th className="px-8 py-4 text-[8px] font-mono uppercase tracking-wider text-neutral-400 font-normal">Node ID</th>
              <th className="px-8 py-4 text-[8px] font-mono uppercase tracking-wider text-neutral-400 font-normal">Domain</th>
              <th className="px-8 py-4 text-[8px] font-mono uppercase tracking-wider text-neutral-400 font-normal">Strategic Action</th>
              <th className="px-8 py-4 text-[8px] font-mono uppercase tracking-wider text-neutral-400 font-normal">Recovery Est.</th>
              <th className="px-8 py-4 text-[8px] font-mono uppercase tracking-wider text-neutral-400 font-normal">Status</th>
              <th className="px-8 py-4 text-[8px] font-mono uppercase tracking-wider text-neutral-400 font-normal text-right">Action</th>
              </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {nodes.map((node) => (
              <tr key={node.internalId} className="group hover:bg-neutral-50/50 transition-colors">
                <td className="px-8 py-5 font-mono text-[9px] font-medium text-neutral-500">
                  #{node.id}
                </td>
                <td className="px-8 py-5">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-700">
                    {node.domain}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <p className="text-[11px] text-neutral-600 leading-relaxed max-w-[280px]">
                    {node.action}
                  </p>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-1.5">
                    <ArrowUpRight className="w-2.5 h-2.5 text-neutral-400" />
                    <span className="text-[9px] font-mono text-neutral-600">
                      {node.recovery}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(node.status)}
                    <span className={`text-[8px] font-mono uppercase tracking-wider ${
                      node.status === 'LIQUIDATED' ? 'text-emerald-600' :
                      node.status === 'IN_PROGRESS' ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {getStatusText(node.status)}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-5 text-right">
                  {node.status === 'OPEN' && (
                    <button
                      onClick={() => handleLiquidation(node.internalId)}
                      disabled={pendingNodeId === node.internalId}
                      className="inline-flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-wider text-neutral-500 hover:text-neutral-800 transition-colors disabled:opacity-50"
                    >
                      {pendingNodeId === node.internalId ? (
                        <Activity className="w-2.5 h-2.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-2.5 h-2.5" />
                      )}
                      <span>Liquidate</span>
                    </button>
                  )}
                  {node.status === 'IN_PROGRESS' && (
                    <div className="flex items-center justify-end gap-1">
                      <Clock className="w-2.5 h-2.5 text-amber-500" />
                      <span className="text-[7px] font-mono text-amber-600">In Progress</span>
                    </div>
                  )}
                  {node.status === 'LIQUIDATED' && (
                    <div className="flex items-center justify-end gap-1">
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" />
                      <span className="text-[7px] font-mono text-emerald-600">Verified</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-8 py-4 border-t border-neutral-100 bg-neutral-50/20">
        <div className="flex items-center justify-between">
          <span className="text-[7px] font-mono text-neutral-400">
            {nodes.filter(n => n.status === 'LIQUIDATED').length} of {nodes.length} nodes resolved
          </span>
          <span className="text-[7px] font-mono text-neutral-400 uppercase tracking-wider">
            Sovereign Registry v1.6
          </span>
        </div>
      </div>
    </div>
  );
}