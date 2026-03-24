// components/canon/CanonContent.tsx
import React from 'react';
import { useMDXComponent } from 'next-contentlayer2/hooks';
import { 
  ChevronRight, 
  Download, 
  BookOpen, 
  Target, 
  Award,
  ArrowRight,
  Sparkles,
  Shield,
  TrendingUp
} from 'lucide-react';

interface CanonContentProps {
  content: string;
  title?: string;
  learningObjectives?: string[];
  onNext?: () => void;
  onDownload?: () => void;
  nextLabel?: string;
  downloadLabel?: string;
  accentColor?: string;
  tier?: 'architect' | 'inner-circle' | 'member' | 'public';
}

const tierConfig = {
  architect: {
    primary: 'from-amber-700 to-amber-900',
    secondary: 'from-amber-50 to-amber-100/50',
    accent: 'amber-900',
    text: 'text-amber-900',
    border: 'border-amber-200',
    glow: 'group-hover:shadow-amber-500/20',
    badge: 'bg-gradient-to-r from-amber-900 to-amber-700 text-white',
    statBg: 'bg-gradient-to-br from-amber-50 to-amber-100/30',
  },
  'inner-circle': {
    primary: 'from-purple-700 to-purple-900',
    secondary: 'from-purple-50 to-purple-100/50',
    accent: 'purple-900',
    text: 'text-purple-900',
    border: 'border-purple-200',
    glow: 'group-hover:shadow-purple-500/20',
    badge: 'bg-gradient-to-r from-purple-900 to-purple-700 text-white',
    statBg: 'bg-gradient-to-br from-purple-50 to-purple-100/30',
  },
  member: {
    primary: 'from-blue-700 to-blue-900',
    secondary: 'from-blue-50 to-blue-100/50',
    accent: 'blue-900',
    text: 'text-blue-900',
    border: 'border-blue-200',
    glow: 'group-hover:shadow-blue-500/20',
    badge: 'bg-gradient-to-r from-blue-900 to-blue-700 text-white',
    statBg: 'bg-gradient-to-br from-blue-50 to-blue-100/30',
  },
  public: {
    primary: 'from-slate-700 to-slate-900',
    secondary: 'from-slate-50 to-slate-100/50',
    accent: 'slate-900',
    text: 'text-slate-900',
    border: 'border-slate-200',
    glow: 'group-hover:shadow-slate-500/20',
    badge: 'bg-gradient-to-r from-slate-900 to-slate-700 text-white',
    statBg: 'bg-gradient-to-br from-slate-50 to-slate-100/30',
  },
};

const CanonContent: React.FC<CanonContentProps> = ({ 
  content, 
  title,
  learningObjectives = [
    "Master foundational principles of institutional governance",
    "Apply strategic frameworks to real-world scenarios",
    "Develop execution capabilities through case studies",
    "Assess organizational readiness and alignment"
  ],
  onNext,
  onDownload,
  nextLabel = "Continue to Next Chapter",
  downloadLabel = "Download Briefing Pack",
  accentColor = "purple",
  tier = 'member',
}) => {
  const MDXContent = useMDXComponent(content);
  const config = tierConfig[tier];

  return (
    <div className="relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.02]">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-slate-900 to-slate-700 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr from-slate-700 to-slate-900 rounded-full blur-3xl" />
      </div>

      {/* Main Content Container */}
      <div className="relative bg-white rounded-3xl shadow-[0_20px_80px_-20px_rgba(0,0,0,0.3)] overflow-hidden border border-white/20 backdrop-blur-sm">
        {/* Header Strip */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${config.primary}`} />

        <div className="p-8 lg:p-12">
          {/* Institutional Header */}
          {title && (
            <div className="mb-10 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-1 h-8 bg-gradient-to-b ${config.primary} rounded-full`} />
                  <span className="text-xs font-mono uppercase tracking-[0.3em] text-slate-400">
                    ABRAHAM OF LONDON • CANONICAL TEXT
                  </span>
                </div>
                <h1 className="font-serif text-4xl lg:text-5xl font-light tracking-tight text-slate-900 leading-tight">
                  {title}
                </h1>
              </div>
              <div className={`hidden lg:flex items-center gap-2 px-4 py-2 ${config.statBg} rounded-full border ${config.border}`}>
                <Sparkles className={`w-4 h-4 ${config.text}`} />
                <span className={`text-xs font-mono uppercase tracking-wider ${config.text}`}>
                  Institutional Edition
                </span>
              </div>
            </div>
          )}

          {/* Learning Objectives - Harrods Green Room meets BlackRock Briefing */}
          <div className="mb-12 group">
            <div className={`relative overflow-hidden rounded-2xl border ${config.border} ${config.statBg} transition-all duration-500 ${config.glow}`}>
              {/* Decorative Corner */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/40 to-transparent opacity-50 rounded-bl-[100px]" />
              
              <div className="relative p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${config.primary} shadow-lg`}>
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl text-slate-900">Strategic Objectives</h2>
                    <p className="text-sm text-slate-500">Institutional briefing framework</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {learningObjectives.map((objective, index) => (
                    <div key={index} className="flex items-start gap-4 group/item">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br ${config.primary} flex items-center justify-center text-white text-sm font-medium shadow-md`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-slate-700 font-medium leading-relaxed">{objective}</p>
                        <div className="flex items-center gap-2 mt-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <span className="text-xs text-slate-400">execution priority</span>
                          <ArrowRight className={`w-3 h-3 ${config.text}`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Key Metrics */}
                <div className="mt-8 pt-6 border-t border-slate-200/60 grid grid-cols-3 gap-6">
                  <div>
                    <div className="text-2xl font-serif text-slate-900">45m</div>
                    <div className="text-xs text-slate-500 mt-1">reading time</div>
                  </div>
                  <div>
                    <div className="text-2xl font-serif text-slate-900">12</div>
                    <div className="text-xs text-slate-500 mt-1">case studies</div>
                  </div>
                  <div>
                    <div className="text-2xl font-serif text-slate-900">98%</div>
                    <div className="text-xs text-slate-500 mt-1">completion rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - MDX Rendered */}
          <div className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:font-light prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed prose-strong:text-slate-900 prose-strong:font-medium prose-a:text-slate-900 prose-a:border-b prose-a:border-slate-200 hover:prose-a:border-slate-400 prose-blockquote:border-l-4 prose-blockquote:border-slate-200 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-slate-600 prose-ul:list-disc prose-ul:pl-6 prose-li:text-slate-600 prose-hr:border-slate-200">
            {MDXContent ? <MDXContent /> : null}
          </div>

          {/* BlackRock-style Action Footer */}
          <div className="mt-16 pt-8 border-t border-slate-200">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
              {/* Left Section - Institutional Metrics */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-500">Institutional Grade</span>
                </div>
                <div className="w-px h-6 bg-slate-200" />
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-500">v2.4.0</span>
                </div>
              </div>

              {/* Right Section - Actions */}
              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                {onDownload && (
                  <button
                    onClick={onDownload}
                    className="group relative inline-flex items-center justify-center gap-3 px-6 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium transition-all hover:border-slate-300 hover:shadow-lg overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-slate-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Download className="w-4 h-4 relative z-10" />
                    <span className="relative z-10 text-sm">{downloadLabel}</span>
                  </button>
                )}
                
                {onNext && (
                  <button
                    onClick={onNext}
                    className={`group relative inline-flex items-center justify-center gap-3 px-8 py-3 bg-gradient-to-r ${config.primary} text-white rounded-xl font-medium transition-all hover:shadow-2xl hover:-translate-y-0.5 overflow-hidden`}
                  >
                    <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <span className="relative z-10 text-sm">{nextLabel}</span>
                    <ChevronRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            </div>

            {/* Decorative Footer Line */}
            <div className="mt-6 flex justify-between items-center text-[8px] font-mono uppercase tracking-widest text-slate-300">
              <span>ABRAHAM OF LONDON • INSTITUTIONAL INTELLIGENCE</span>
              <span>CANONICAL • v3.1.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanonContent;