// components/canon/CanonHero.tsx - SIMPLE FIX (NO NEED FOR safe-compat.ts)
import React from "react";
import Image from "next/image";
import { 
  safeString, 
  safeNumber, 
  safeImageSrc,
  safeArray,
  safeUrl,
  classNames,
  safeFirstChar, // Already exists in /lib/shared/safe.ts
  safeSlice, // Already exists in /lib/shared/safe.ts  
  safeCapitalize, // Already exists in /lib/shared/safe.ts
} from "@/lib/utils/safe"; // ✅ Use the main safe module
import { BookOpen, Clock, Award, Download, Sparkles, Calendar, ArrowRight } from "lucide-react";

interface CanonHeroProps {
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  coverImage?: string | null;
  category?: string | null;
  difficulty?: "beginner" | "intermediate" | "advanced" | string | null;
  estimatedHours?: number | null;
  version?: string | null;
  tags?: (string | null | undefined)[];
  author?: string | null;
  publishedDate?: string | Date | null;
}

const difficultyConfig = {
  beginner: {
    label: "Beginner",
    classes: "bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 text-emerald-400 border-emerald-500/30",
    icon: "🌱"
  },
  intermediate: {
    label: "Intermediate",
    classes: "bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-400 border-amber-500/30",
    icon: "⚡"
  },
  advanced: {
    label: "Advanced",
    classes: "bg-gradient-to-r from-rose-500/20 to-rose-600/10 text-rose-400 border-rose-500/30",
    icon: "🔥"
  }
};

const CanonHero: React.FC<CanonHeroProps> = (props) => {
  // Extract and sanitize all values
  const title = safeString(props.title, "Manuscript");
  const subtitle = safeString(props.subtitle);
  const description = safeString(props.description, "A foundational text for builders and thinkers.");
  const category = safeString(props.category, "Canon");
  const difficulty = safeString(props.difficulty, "beginner").toLowerCase() as keyof typeof difficultyConfig;
  const estimatedHours = safeNumber(props.estimatedHours, 0);
  const version = safeString(props.version, "1.0.0");
  const author = safeString(props.author, "Abraham of London");
  const publishedDate = props.publishedDate;
  const tags = safeArray<string>(props.tags);
  
  // Get difficulty configuration
  const diffConfig = difficultyConfig[difficulty] || difficultyConfig.beginner;
  
  // Format hours
  const hoursText = estimatedHours > 0 
    ? `${Math.round(estimatedHours)} ${estimatedHours === 1 ? 'hour' : 'hours'}`
    : "Self-paced";
  
  // Format date
  const formattedDate = publishedDate 
    ? new Date(publishedDate).toLocaleDateString('en-GB', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : "Coming soon";
  
  // Safe image source
  const imageSrc = safeImageSrc(props.coverImage);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-950 to-black">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/5 via-transparent to-purple-900/5 animate-gradient-shift" />
      
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 bg-[size:50px_50px] bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)]" />
      
      <div className="relative mx-auto max-w-8xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-24">
          {/* Left Column: Content */}
          <div className="space-y-8">
            {/* Meta badges */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-semibold backdrop-blur-sm border border-white/10">
                <Sparkles className="h-3 w-3 text-gold" />
                {category}
              </span>
              
              <span className={classNames(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border",
                diffConfig.classes
              )}>
                <span>{diffConfig.icon}</span>
                {diffConfig.label}
              </span>
              
              {estimatedHours > 0 && (
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-400 border border-blue-500/20">
                  <Clock className="h-3 w-3" />
                  {hoursText}
                </span>
              )}
              
              <span className="font-mono text-xs text-gray-400">
                v{version}
              </span>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
                <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                  {title}
                </span>
              </h1>
              
              {subtitle && (
                <h2 className="text-xl font-light text-purple-200 md:text-2xl">
                  {subtitle}
                </h2>
              )}
            </div>

            {/* Description */}
            <p className="text-lg leading-relaxed text-gray-300 max-w-3xl">
              {description}
            </p>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {safeFirstChar(author, 'A')}
                  </span>
                </div>
                <span>{author}</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-400">
                <Calendar className="h-4 w-4" />
                <span>{formattedDate}</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-400">
                <Award className="h-4 w-4" />
                <span>Certificate Available</span>
              </div>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-4">
                {safeSlice(tags, 0, 6).map((tag, index) => (
                  <span
                    key={index}
                    className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors cursor-pointer border border-white/10 hover:border-white/20"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 pt-6">
              <button className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-amber-500 px-6 py-3 font-semibold text-black transition-all hover:shadow-lg hover:shadow-gold/20">
                <BookOpen className="h-5 w-5" />
                <span>Start Reading</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              
              <button className="flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20">
                <Download className="h-5 w-5" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          {/* Right Column: Cover Image */}
          <div className="relative">
            {/* Floating image container */}
            <div className="relative h-[480px] overflow-hidden rounded-3xl shadow-2xl border border-white/10 group">
              {imageSrc ? (
                <Image
                  src={imageSrc}
                  alt={title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    target.parentElement?.classList.add('bg-gradient-to-br', 'from-purple-900', 'to-blue-900');
                  }}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-blue-900" />
              )}
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Decorative corner accents */}
              <div className="absolute top-0 left-0 h-12 w-12 border-t-2 border-l-2 border-gold/50 rounded-tl-xl" />
              <div className="absolute bottom-0 right-0 h-12 w-12 border-b-2 border-r-2 border-gold/50 rounded-br-xl" />
            </div>
            
            {/* Decorative floating elements */}
            <div className="absolute -top-6 -left-6 h-48 w-48 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-3xl animate-pulse-slow" />
            <div className="absolute -bottom-6 -right-6 h-48 w-48 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 blur-3xl animate-pulse-slower" />
          </div>
        </div>
      </div>
      
      {/* Subtle scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="h-8 w-px bg-gradient-to-b from-gold via-transparent to-transparent" />
      </div>
      
      {/* Custom animations */}
      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.3; }
        }
        .animate-gradient-shift {
          animation: gradient-shift 8s ease-in-out infinite;
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.05; }
          50% { opacity: 0.15; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }
        
        @keyframes pulse-slower {
          0%, 100% { opacity: 0.03; }
          50% { opacity: 0.1; }
        }
        .animate-pulse-slower {
          animation: pulse-slower 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default CanonHero;