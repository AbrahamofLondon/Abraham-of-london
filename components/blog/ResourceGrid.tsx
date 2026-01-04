/* @/components/blog/ResourceGrid.tsx - INSTITUTIONAL COMPONENT */
import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, ExternalLink, ShieldCheck, ChevronRight } from 'lucide-react';

interface Resource {
  title: string;
  url: string;
  format: string;
  size?: string;
  isExternal?: boolean;
}

interface ResourceGridProps {
  resources?: Resource[];
  variant?: 'primary' | 'secondary';
}

export const ResourceGrid: React.FC<ResourceGridProps> = ({ resources = [], variant = 'primary' }) => {
  if (resources.length === 0) return null;

  return (
    <div className="my-12 w-full">
      <div className="flex items-center gap-2 mb-6 px-4 py-1.5 w-fit rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-500 text-[10px] font-bold uppercase tracking-[0.2em]">
        <ShieldCheck className="w-3.5 h-3.5" /> Institutional Artifacts
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resources.map((res, index) => (
          <motion.a
            key={index}
            href={res.url}
            target={res.isExternal ? "_blank" : "_self"}
            rel={res.isExternal ? "noopener noreferrer" : ""}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
            className={`group relative flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
              variant === 'primary' 
                ? 'bg-zinc-900/40 border-white/5 hover:border-amber-500/30 hover:bg-zinc-900/60' 
                : 'bg-black/20 border-zinc-800 hover:border-zinc-600'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/5 text-gray-400 group-hover:text-amber-500 transition-colors">
                {res.format.includes('PDF') ? <FileText className="w-5 h-5" /> : <ExternalLink className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-sm font-medium text-cream group-hover:text-amber-500 transition-colors">
                  {res.title}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                  <span>{res.format}</span>
                  {res.size && (
                    <>
                      <span className="opacity-30">•</span>
                      <span>{res.size}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 group-hover:bg-amber-500 group-hover:text-black transition-all">
              {res.isExternal ? <ExternalLink className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
};

export default ResourceGrid;