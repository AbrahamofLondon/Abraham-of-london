/* components/blog/BlogHeader.tsx - INSTITUTIONAL EDITION */
import React from 'react';
import Image from 'next/image';
import { Calendar, Clock, User, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface BlogHeaderProps {
  title: string;
  author: string | null;
  date: string;
  coverImage: string | null;
  tags: string[];
}

const BlogHeader: React.FC<BlogHeaderProps> = ({
  title,
  author,
  date,
  coverImage,
  tags,
}) => {
  return (
    <div className="relative bg-black pt-20 pb-12 lg:pt-32 lg:pb-20 overflow-hidden border-b border-white/5">
      {/* Background Architectural Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#1a1510,_#000000)] opacity-60" />
      <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(white,transparent_70%)]" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Institutional Badge & Tags */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap justify-center items-center gap-3 mb-8"
          >
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-500 text-[9px] font-bold uppercase tracking-[0.2em]">
              <ShieldCheck className="w-3 h-3" /> Principal Insight
            </div>
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-white/5 border border-white/10 text-gray-400 text-[10px] font-bold uppercase tracking-wider rounded-full"
              >
                {tag}
              </span>
            ))}
          </motion.div>
          
          {/* Title - Serif Branding */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl md:text-6xl lg:text-7xl text-cream mb-10 leading-[1.1] tracking-tight"
          >
            {title}
          </motion.h1>
          
          {/* Metadata Grid */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-8 text-[11px] text-gray-500 uppercase tracking-[0.15em] font-bold mb-12"
          >
            {author && (
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 text-amber-500" />
                </div>
                <span className="text-gray-300">{author}</span>
              </div>
            )}
            <div className="flex items-center gap-2.5">
              <Calendar className="w-3.5 h-3.5 text-amber-500/50" />
              <span>{date}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="w-3.5 h-3.5 text-amber-500/50" />
              <span>12 min read</span>
            </div>
          </motion.div>
        </div>
        
        {/* Optimized Hero Image Container */}
        {coverImage && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-12 max-w-5xl mx-auto"
          >
            <div className="relative aspect-[21/9] rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_50px_-12px_rgba(245,158,11,0.2)]">
              <Image
                src={coverImage}
                alt={title}
                fill
                className="object-cover transition-transform duration-1000 hover:scale-105"
                priority // Force high-priority loading for LCP
                sizes="(max-width: 1280px) 100vw, 1280px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BlogHeader;
