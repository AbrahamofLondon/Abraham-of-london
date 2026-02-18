// components/VaultActivityFeed.tsx — HARRODS-LEVEL INSTITUTIONAL ACTIVITY STREAM
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radio, 
  Shield, 
  Zap, 
  Lock, 
  Globe, 
  TrendingUp, 
  Clock, 
  Fingerprint,
  Sparkles,
  ChevronRight 
} from 'lucide-react';
import Link from 'next/link';

interface AuditEntry {
  id: string;
  title: string;
  type: string;
  tier: 'public' | 'inner-circle' | 'private';
  date: string;
}

interface VaultActivityFeedProps {
  inventory: AuditEntry[];
  showCount?: number;
  className?: string;
}

// ✅ FIXED: Animation variants with proper easing
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.5,
      ease: [0.2, 0.8, 0.2, 1] as any
    }
  },
};

// Helper to construct href based on type and id
const getEntryHref = (type: string, id: string): string => {
  const baseType = type.toLowerCase();
  
  // Map content types to their routes
  const routeMap: Record<string, string> = {
    canon: 'canon',
    brief: 'briefs',
    short: 'shorts',
    download: 'downloads',
    resource: 'resources',
    event: 'events',
    print: 'prints',
    strategy: 'strategy',
    intelligence: 'intelligence',
    dispatch: 'dispatches',
    book: 'books',
  };

  const route = routeMap[baseType] || 'registry';
  return `/${route}/${id}`;
};

// Tier icons with proper styling
const TierIcon = ({ tier }: { tier: AuditEntry['tier'] }) => {
  switch (tier) {
    case 'public':
      return <Globe size={12} className="text-emerald-500/60" />;
    case 'inner-circle':
      return <Lock size={12} className="text-amber-500/80" />;
    case 'private':
      return <Shield size={12} className="text-rose-500/80" />;
    default:
      return <Fingerprint size={12} className="text-zinc-500/60" />;
  }
};

// Tier badge for visual distinction
const TierBadge = ({ tier }: { tier: AuditEntry['tier'] }) => {
  const styles = {
    public: 'bg-emerald-500/10 text-emerald-500/70 border-emerald-500/20',
    'inner-circle': 'bg-amber-500/10 text-amber-500/70 border-amber-500/20',
    private: 'bg-rose-500/10 text-rose-500/70 border-rose-500/20',
  };

  return (
    <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-full border ${styles[tier]}`}>
      {tier}
    </span>
  );
};

export default function VaultActivityFeed({ 
  inventory, 
  showCount = 5,
  className = "" 
}: VaultActivityFeedProps) {
  // Sort by date and take the most recent additions
  const recentActivity = React.useMemo(() => {
    return [...inventory]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, showCount);
  }, [inventory, showCount]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={`w-full bg-gradient-to-br from-black via-zinc-950 to-black border border-white/5 rounded-2xl overflow-hidden ${className}`}
    >
      {/* Header with live indicator */}
      <div className="relative border-b border-white/5 bg-white/[0.02] px-6 py-5">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(245,158,11,0.03),transparent_50%)]" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Radio size={16} className="text-amber-500" />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-amber-500/20 rounded-full blur-sm"
              />
            </div>
            
            <div>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.35em] text-white/90">
                Live Intelligence Feed
              </h3>
              <p className="text-[9px] font-mono text-white/30 tracking-wider mt-1">
                Registry Updates // Real-time
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <TrendingUp size={12} className="text-emerald-500/60" />
            <span className="font-mono text-[8px] text-white/30 uppercase tracking-wider">
              {inventory.length} Total Assets
            </span>
          </div>
        </div>
      </div>

      {/* Activity stream */}
      <div className="p-4 md:p-6">
        <AnimatePresence mode="popLayout">
          {recentActivity.length > 0 ? (
            <motion.div variants={containerVariants} className="space-y-3">
              {recentActivity.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  variants={itemVariants}
                  layout
                  className="group relative"
                >
                  <Link 
                    // ✅ FIXED: Using local helper instead of getDocHref
                    href={getEntryHref(entry.type, entry.id)}
                    className="block"
                  >
                    <div className="relative flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-300 hover:border-amber-500/20 hover:shadow-lg hover:shadow-amber-500/5">
                      {/* Timeline connector for visual flow */}
                      {i < recentActivity.length - 1 && (
                        <div className="absolute left-7 top-12 bottom-0 w-px bg-gradient-to-b from-white/10 to-transparent" />
                      )}
                      
                      {/* Tier indicator with icon */}
                      <div className="relative mt-1">
                        <div className="relative z-10">
                          <TierIcon tier={entry.tier} />
                        </div>
                        {/* Pulse effect for newest entry */}
                        {i === 0 && (
                          <motion.div
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-amber-500/30 rounded-full blur-sm"
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-1.5">
                          <span className="font-mono text-[9px] uppercase tracking-wider text-white/40">
                            {entry.type}
                          </span>
                          <TierBadge tier={entry.tier} />
                          <div className="flex items-center gap-1.5 text-white/20">
                            <Clock size={10} />
                            <span className="font-mono text-[8px] uppercase tracking-wider">
                              {formatDate(entry.date)}
                            </span>
                          </div>
                        </div>
                        
                        <h4 className="font-serif text-base md:text-lg italic text-white/90 group-hover:text-white transition-colors truncate pr-8">
                          {entry.title}
                        </h4>

                        {/* Subtle ID for reference */}
                        <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Fingerprint size={8} className="text-white/20" />
                          <span className="font-mono text-[7px] text-white/20 uppercase tracking-wider">
                            Ref: {entry.id.slice(-8)}
                          </span>
                        </div>
                      </div>

                      {/* Hover indicator */}
                      <motion.div
                        initial={{ x: -10, opacity: 0 }}
                        whileHover={{ x: 0, opacity: 1 }}
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                      >
                        <ChevronRight size={14} className="text-amber-500/60" />
                      </motion.div>

                      {/* New entry badge */}
                      {i === 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2 -right-2"
                        >
                          <span className="relative flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 text-[8px] font-bold text-black items-center justify-center">
                              NEW
                            </span>
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
                <Radio size={24} className="text-white/20" />
              </div>
              <p className="text-white/40 font-mono text-xs uppercase tracking-wider">
                No recent activity
              </p>
              <p className="text-white/20 text-[10px] font-mono mt-2">
                The vault is being indexed
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer with call to action */}
      <div className="border-t border-white/5 bg-white/[0.01] p-4">
        <Link 
          href="/registry"
          className="group flex items-center justify-between px-4 py-3 rounded-lg border border-white/5 hover:border-amber-500/20 hover:bg-white/[0.02] transition-all duration-300"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Sparkles size={12} className="text-amber-500/60" />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-amber-500/20 rounded-full blur-sm"
              />
            </div>
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/60 group-hover:text-white transition-colors">
              Explore Full Registry
            </span>
          </div>
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronRight size={14} className="text-amber-500/60" />
          </motion.div>
        </Link>
        
        {/* System status indicator */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-[7px] text-white/20 uppercase tracking-wider">
            Node: LDN_EDGE_01 • Signal: Strong
          </span>
        </div>
      </div>
    </motion.div>
  );
}