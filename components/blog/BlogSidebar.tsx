'use client';

import React from 'react';
import Link from 'next/link';
import {
  User,
  Mail,
  Hash,
  ListTree,
  ShieldCheck,
  ArrowRight,
  Clock
} from 'lucide-react';

interface BlogSidebarProps {
  author?: string | null;
  publishedDate?: string;
  tags?: string[];
  tier?: 'free' | 'member' | 'architect';
}

const BlogSidebar: React.FC<BlogSidebarProps> = ({
  author = 'Abraham of London',
  publishedDate = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' }),
  tags = [],
  tier = 'free'
}) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
      
      {/* 1. INSTITUTIONAL AUTHOR CARD */}
      {author && (
        <div className="bg-zinc-900/40 backdrop-blur-sm border border-white/5 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center">
              <User className="w-7 h-7 text-amber-500" />
            </div>
            <div>
              <h3 className="font-serif text-lg text-cream leading-none">{author}</h3>
              <p className="text-[10px] text-amber-500 uppercase tracking-widest font-bold mt-2">Principal Content</p>
            </div>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed mb-6">
            Strategic insights and institutional frameworks curated by {author}. Focused on legacy architecture and personal development.
          </p>
          <div className="flex items-center gap-3 text-[11px] text-gray-500 mb-6">
            <Clock className="w-3.5 h-3.5" />
            <span>Published {publishedDate}</span>
          </div>
          <button className="w-full bg-white/5 hover:bg-white/10 text-cream border border-white/10 text-xs font-bold uppercase tracking-widest py-3 px-4 rounded-xl transition-all">
            View Profile
          </button>
        </div>
      )}

      {/* 2. DYNAMIC ACCESS TIER CARD */}
      <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-3xl p-8">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-amber-500" />
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">Access Level</h3>
        </div>
        <h4 className="font-serif text-xl text-cream mb-4 capitalize">{tier} Content</h4>
        <p className="text-xs text-gray-400 leading-relaxed mb-6">
          This artifact is part of the {tier} repository. Members gain access to interactive worksheets and fillable PDF frameworks.
        </p>
        <Link 
          href="/pricing"
          className="group flex items-center justify-between w-full bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-bold uppercase tracking-widest py-4 px-6 rounded-xl transition-all"
        >
          Upgrade Access <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* 3. TABLE OF CONTENTS (Semantic) */}
      <div className="bg-zinc-900/20 border border-white/5 rounded-3xl p-8">
        <div className="flex items-center gap-2 mb-6">
          <ListTree className="w-4 h-4 text-gray-500" />
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Structure</h3>
        </div>
        <nav className="space-y-4">
          {['Introduction', 'Historical Context', 'Strategic Framework', 'Practical Execution'].map((item, index) => (
            <a
              key={index}
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
              className="flex items-center text-sm text-gray-400 hover:text-amber-500 transition-colors group"
            >
              <span className="text-[10px] text-gray-700 mr-3 font-mono">0{index + 1}</span>
              {item}
            </a>
          ))}
        </nav>
      </div>

      {/* 4. TAGS (Institutional Style) */}
      {tags.length > 0 && (
        <div className="bg-zinc-900/20 border border-white/5 rounded-3xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <Hash className="w-4 h-4 text-gray-500" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Taxonomy</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-white/5 border border-white/5 text-gray-400 text-[10px] font-bold uppercase tracking-wider rounded-lg hover:border-amber-500/30 hover:text-amber-500 transition-all cursor-default"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 5. INSTITUTIONAL NEWSLETTER */}
      <div className="relative overflow-hidden bg-zinc-900 border border-amber-500/10 rounded-3xl p-8">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Mail className="w-24 h-24 text-amber-500" />
        </div>
        <h3 className="font-serif text-xl text-cream mb-2 relative z-10">The Circular</h3>
        <p className="text-xs text-gray-500 mb-6 relative z-10">
          Bi-weekly dispatches on institutional design and legacy architecture.
        </p>
        <div className="space-y-3 relative z-10">
          <input
            type="email"
            placeholder="Institutional Email"
            className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-cream placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all text-xs"
          />
          <button className="w-full bg-white text-black hover:bg-cream text-[10px] font-bold uppercase tracking-widest py-3 px-4 rounded-xl transition-all">
            Join Register
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlogSidebar;