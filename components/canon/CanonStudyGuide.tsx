'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Video,
  Headphones,
  Link as LinkIcon,
  Pencil,
  Clock,
  CheckCircle,
  Circle,
  Sparkles,
} from 'lucide-react';

interface StudyMaterial {
  id: string;
  title: string;
  description: string;
  type: 'pdf' | 'video' | 'audio' | 'link' | 'exercise';
  duration?: string;
  size?: string;
  url: string;
}

interface StudyGuideSection {
  id: string;
  title: string;
  description: string;
  materials: StudyMaterial[];
}

interface CanonStudyGuideProps {
  sections: StudyGuideSection[];
}

// ------------------------------------------------------------------
// Helper – maps material type to icon & color scheme
// ------------------------------------------------------------------
const materialConfig = {
  pdf: {
    icon: FileText,
    bg: 'bg-amber-500/10',
    text: 'text-amber-300',
    border: 'border-amber-500/20',
    hoverBg: 'hover:bg-amber-500/15',
  },
  video: {
    icon: Video,
    bg: 'bg-blue-500/10',
    text: 'text-blue-300',
    border: 'border-blue-500/20',
    hoverBg: 'hover:bg-blue-500/15',
  },
  audio: {
    icon: Headphones,
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-300',
    border: 'border-emerald-500/20',
    hoverBg: 'hover:bg-emerald-500/15',
  },
  link: {
    icon: LinkIcon,
    bg: 'bg-purple-500/10',
    text: 'text-purple-300',
    border: 'border-purple-500/20',
    hoverBg: 'hover:bg-purple-500/15',
  },
  exercise: {
    icon: Pencil,
    bg: 'bg-rose-500/10',
    text: 'text-rose-300',
    border: 'border-rose-500/20',
    hoverBg: 'hover:bg-rose-500/15',
  },
} as const;

export default function CanonStudyGuide({ sections }: CanonStudyGuideProps) {
  // ------------------------------------------------------------------
  // State – collapsible sections + completion tracking
  // ------------------------------------------------------------------
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    sections.reduce((acc, s) => ({ ...acc, [s.id]: true }), {})
  );

  const [completedMaterials, setCompletedMaterials] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const toggleMaterial = (materialId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCompletedMaterials((prev) => {
      const next = new Set(prev);
      if (next.has(materialId)) {
        next.delete(materialId);
      } else {
        next.add(materialId);
      }
      return next;
    });
  };

  const isAllCompleted = (materialIds: string[]) =>
    materialIds.every((id) => completedMaterials.has(id));

  const sectionProgress = (section: StudyGuideSection) => {
    const total = section.materials.length;
    const completed = section.materials.filter((m) => completedMaterials.has(m.id)).length;
    return { total, completed, percentage: total ? (completed / total) * 100 : 0 };
  };

  const totalMaterials = sections.reduce((acc, s) => acc + s.materials.length, 0);
  const totalCompleted = [...completedMaterials].filter((id) =>
    sections.some((s) => s.materials.some((m) => m.id === id))
  ).length;
  const overallProgress = totalMaterials ? (totalCompleted / totalMaterials) * 100 : 0;

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <div className="space-y-8">
      {/* Header – overall progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-zinc-900/40 p-6 backdrop-blur-sm">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            Study Intelligence
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Curated materials to deepen your command
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-2xl font-bold text-amber-400">
              {totalCompleted}
            </span>
            <span className="text-sm text-zinc-500"> / {totalMaterials}</span>
          </div>
          <div className="h-2 w-32 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-700"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section) => {
          const progress = sectionProgress(section);
          const isOpen = openSections[section.id] ?? true;
          const allDone = isAllCompleted(section.materials.map((m) => m.id));

          return (
            <div
              key={section.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 backdrop-blur-sm transition-all duration-300"
            >
              {/* Section header – click to collapse/expand */}
              <button
                onClick={() => toggleSection(section.id)}
                className="flex w-full items-center justify-between gap-4 bg-zinc-900/80 p-5 text-left hover:bg-zinc-900/90 transition-colors"
                aria-expanded={isOpen}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-serif font-semibold text-white">
                      {section.title}
                    </span>
                    {allDone && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-[0.65rem] font-medium uppercase tracking-wider text-emerald-300">
                        <CheckCircle className="h-3 w-3" />
                        Complete
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">{section.description}</p>
                </div>

                <div className="flex items-center gap-6">
                  {/* Mini progress ring */}
                  <div className="hidden sm:block">
                    <div className="relative h-12 w-12">
                      <svg className="h-12 w-12 -rotate-90">
                        <circle
                          className="text-white/10"
                          strokeWidth="3"
                          stroke="currentColor"
                          fill="transparent"
                          r="20"
                          cx="24"
                          cy="24"
                        />
                        <circle
                          className="text-amber-400 transition-all duration-700"
                          strokeWidth="3"
                          strokeDasharray={2 * Math.PI * 20}
                          strokeDashoffset={2 * Math.PI * 20 * (1 - progress.percentage / 100)}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r="20"
                          cx="24"
                          cy="24"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                        {progress.completed}/{progress.total}
                      </span>
                    </div>
                  </div>

                  {isOpen ? (
                    <ChevronDown className="h-5 w-5 text-zinc-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-zinc-400" />
                  )}
                </div>
              </button>

              {/* Collapsible materials */}
              {isOpen && (
                <div className="divide-y divide-white/5">
                  {section.materials.map((material) => {
                    const isCompleted = completedMaterials.has(material.id);
                    const config = materialConfig[material.type];
                    const Icon = config.icon;

                    return (
                      <div
                        key={material.id}
                        className={`group relative flex items-start gap-4 p-5 transition-colors ${
                          isCompleted ? 'bg-amber-500/5' : 'hover:bg-white/5'
                        }`}
                      >
                        {/* Completion toggle */}
                        <button
                          onClick={(e) => toggleMaterial(material.id, e)}
                          className="mt-1 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-full"
                          aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                        >
                          {isCompleted ? (
                            <CheckCircle className="h-5 w-5 text-amber-400" />
                          ) : (
                            <Circle className="h-5 w-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                          )}
                        </button>

                        {/* Icon + content */}
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div
                                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border ${config.border} ${config.bg}`}
                              >
                                <Icon className={`h-5 w-5 ${config.text}`} />
                              </div>

                              <div>
                                <h4 className="font-medium text-white">{material.title}</h4>
                                <p className="mt-1 text-sm text-zinc-400">
                                  {material.description}
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-3">
                                  <span
                                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider ${config.border} ${config.bg} ${config.text}`}
                                  >
                                    {material.type}
                                  </span>
                                  {material.duration && (
                                    <span className="flex items-center gap-1 text-xs text-zinc-500">
                                      <Clock className="h-3 w-3" />
                                      {material.duration}
                                    </span>
                                  )}
                                  {material.size && (
                                    <span className="text-xs text-zinc-500">
                                      {material.size}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Download / View button */}
                            <a
                              href={material.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-colors ${config.bg} ${config.text} ${config.hoverBg} border ${config.border}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Download className="h-4 w-4" />
                              <span className="hidden sm:inline">
                                {material.type === 'link' ? 'Open' : 'Download'}
                              </span>
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* “All complete” celebration banner */}
                  {allDone && (
                    <div className="bg-gradient-to-r from-amber-500/10 to-transparent p-4 text-sm text-amber-300 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      <span>You’ve mastered this section. Exceptional.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Global “Download All” – only if at least one material exists */}
      {totalMaterials > 0 && (
        <div className="flex justify-end pt-4">
          <button className="group inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/25">
            <Download className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
            Download All Materials
          </button>
        </div>
      )}
    </div>
  );
}