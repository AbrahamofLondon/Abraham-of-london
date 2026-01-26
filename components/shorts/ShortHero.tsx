'use client';

import React from 'react';
import { 
  safeString, 
  safeFirstChar, 
  safeArray,
  safeDate,
  formatSafeDate,
  classNames 
} from '@/lib/utils/safe';
import { Clock, Calendar, User, Sparkles } from 'lucide-react';

interface ShortHeroProps {
  title?: string | null;
  excerpt?: string | null;
  author?: string | null;
  date?: string | Date | null;
  readTime?: string | number | null;
  category?: (string | null | undefined)[];
  theme?: string | null;
}

const ShortHero: React.FC<ShortHeroProps> = (props) => {
  // Extract and sanitize
  const title = safeString(props.title, 'Field Note');
  const excerpt = safeString(props.excerpt, 'A brief insight for builders and thinkers.');
  const author = safeString(props.author, 'Abraham of London');
  const date = props.date;
  const readTime = safeString(props.readTime, '2 min read');
  const categories = safeArray<string>(props.category);
  const theme = safeString(props.theme, 'insight').toLowerCase();
  
  // Format date
  const formattedDate = date 
    ? formatSafeDate(date, { month: 'long', day: 'numeric', year: 'numeric' })
    : formatSafeDate(new Date());
  
  // Get theme colors
  const themeColors = {
    insight: 'from-amber-500 to-orange-500',
    reflection: 'from-blue-500 to-purple-500',
    wisdom: 'from-emerald-500 to-teal-500',
    challenge: 'from-rose-500 to-pink-500',
  };
  
  const themeGradient = themeColors[theme as keyof typeof themeColors] || themeColors.insight;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-950 to-black py-20 md:py-28">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className={classNames(
          "absolute inset-0 bg-gradient-to-br opacity-10",
          themeGradient
        )} />
        
        {/* Geometric pattern */}
        <div className="absolute inset-0 bg-[size:100px_100px] bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)]" />
        
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/4 h-2 w-2 rounded-full bg-amber-500/20 animate-pulse" />
        <div className="absolute top-1/3 right-1/4 h-1 w-1 rounded-full bg-blue-500/20 animate-pulse" />
        <div className="absolute bottom-1/4 left-1/3 h-1.5 w-1.5 rounded-full bg-purple-500/20 animate-pulse" />
      </div>
      
      <div className="relative container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Category Tags */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {safeSlice(categories, 0, 3).map((cat, index) => (
                <span
                  key={index}
                  className="group relative overflow-hidden rounded-full px-4 py-1.5 text-xs font-bold tracking-wider uppercase backdrop-blur-sm border"
                >
                  <div className={classNames(
                    "absolute inset-0 bg-gradient-to-r opacity-10 group-hover:opacity-20 transition-opacity",
                    themeGradient
                  )} />
                  <span className={classNames(
                    "relative bg-gradient-to-r bg-clip-text text-transparent",
                    themeGradient
                  )}>
                    {cat}
                  </span>
                </span>
              ))}
            </div>
          )}
          
          {/* Title with gradient */}
          <h1 className="mb-8 text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            <span className={classNames(
              "bg-gradient-to-r bg-clip-text text-transparent",
              themeGradient
            )}>
              {title}
            </span>
          </h1>
          
          {/* Excerpt */}
          <p className="mb-12 text-xl md:text-2xl text-gray-300 leading-relaxed max-w-2xl">
            {excerpt}
          </p>
          
          {/* Meta Information */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 pt-8 border-t border-zinc-800/50">
            {/* Author */}
            <div className="group flex items-center gap-4">
              <div className="relative">
                <div className={classNames(
                  "h-12 w-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg",
                  "bg-gradient-to-r",
                  themeGradient
                )}>
                  {safeFirstChar(author, 'A')}
                </div>
                
                {/* Active indicator */}
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-black bg-green-500" />
              </div>
              
              <div>
                <p className="font-semibold text-white group-hover:text-gray-200 transition-colors">
                  {author}
                </p>
                <p className="text-sm text-gray-400">Author</p>
              </div>
            </div>
            
            {/* Date & Read Time */}
            <div className="flex flex-wrap gap-6">
              <div className="group">
                <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-300 transition-colors mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Published</span>
                </div>
                <p className="font-medium text-white group-hover:text-gray-200 transition-colors">
                  {formattedDate}
                </p>
              </div>
              
              <div className="group">
                <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-300 transition-colors mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Reading Time</span>
                </div>
                <p className="font-medium text-white group-hover:text-gray-200 transition-colors">
                  {readTime}
                </p>
              </div>
              
              <div className="group">
                <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-300 transition-colors mb-1">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm">Theme</span>
                </div>
                <p className="font-medium text-white group-hover:text-gray-200 transition-colors">
                  {safeCapitalize(theme, 'Insight')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative corner accents */}
      <div className="absolute top-0 right-0 h-64 w-64 bg-gradient-to-bl from-amber-500/5 via-transparent to-purple-500/5 rounded-full -translate-y-32 translate-x-32" />
      <div className="absolute bottom-0 left-0 h-96 w-96 bg-gradient-to-tr from-amber-500/3 via-transparent to-purple-500/10 rounded-full translate-y-48 -translate-x-48" />
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="h-8 w-px bg-gradient-to-b from-amber-500 via-transparent to-transparent" />
      </div>
    </div>
  );
};

export default ShortHero;