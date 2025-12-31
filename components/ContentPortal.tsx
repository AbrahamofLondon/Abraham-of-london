'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { BaseCard } from '@/components/Cards';

// Define Category type locally (no Contentlayer dependency yet)
interface Category {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  count: number;
  signal: { subtle: string; texture: string };
}

export function ContentPortal() {
  const router = useRouter();
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [hoveredCategory, setHoveredCategory] = React.useState<string | null>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    // Keep mock data for now (safe)
    const mockCategories: Category[] = [
      {
        id: 'strategic-insights',
        title: 'Strategic Insights',
        description: 'Architectural thinking for complex systems',
        icon: '↗',
        color: '#d4af37',
        count: 24,
        signal: { subtle: 'Structural principles for decision-making', texture: 'architectural' },
      },
      {
        id: 'curated-volumes',
        title: 'Curated Volumes',
        description: 'Complete frameworks in bound form',
        icon: '📚',
        color: '#b8941f',
        count: 12,
        signal: { subtle: 'Comprehensive architectural systems', texture: 'bound' },
      },
      {
        id: 'execution-tools',
        title: 'Execution Tools',
        description: 'Instruments for implementation',
        icon: '⚙',
        color: '#9c7c1a',
        count: 18,
        signal: { subtle: 'Applied architectural instruments', texture: 'instrument' },
      },
      {
        id: 'scholarly-gatherings',
        title: 'Scholarly Gatherings',
        description: 'Live architectural discourse',
        icon: '𓇯',
        color: '#806515',
        count: 8,
        signal: { subtle: 'Live structural conversations', texture: 'gathering' },
      },
      {
        id: 'print-editions',
        title: 'Print Editions',
        description: 'Physical manifestations of structure',
        icon: '𓍯',
        color: '#645010',
        count: 6,
        signal: { subtle: 'Tactile architectural expressions', texture: 'physical' },
      },
      {
        id: 'scholars-toolkit',
        title: 'Scholar\'s Toolkit',
        description: 'Supplementary structural materials',
        icon: '☿',
        color: '#48390b',
        count: 14,
        signal: { subtle: 'Auxiliary structural components', texture: 'supplementary' },
      }
    ];
    
    setCategories(mockCategories);
    
    // Animation delay
    const timer = setTimeout(() => setIsLoaded(true), 100);
    
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleCategoryClick = async (categoryId: string) => {
    try {
      router.push(`/content?category=${categoryId}`);
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to direct navigation
      window.location.href = `/content?category=${categoryId}`;
    }
  };

  const getHoveredCategory = () => {
    return categories.find(cat => cat.id === hoveredCategory);
  };

  const hoveredCategoryData = getHoveredCategory();

  // Mock featured content data
  const featuredContent = [
    {
      slug: 'architectural-framework-v1',
      title: 'Architectural Framework v1.0',
      description: 'A comprehensive system for structural decision-making with adaptive governance layers',
      category: 'Strategic Insights',
      date: '2024-01-15',
      readingTime: '12 min',
      tags: ['Strategic', 'Framework', 'Governance'],
      featured: true,
      isNew: true,
      coverImage: '/images/framework-cover.jpg',
    },
    {
      slug: 'bound-volumes-guide',
      title: 'Bound Volumes: Curator\'s Guide',
      description: 'Complete methodologies for compiling and structuring archival knowledge systems',
      category: 'Curated Volumes',
      date: '2024-01-10',
      readingTime: '8 min',
      tags: ['Archival', 'Methodology', 'Systems'],
      featured: true,
      isNew: false,
      coverImage: '/images/volumes-cover.jpg',
    },
    {
      slug: 'execution-instruments',
      title: 'Execution Instruments Toolkit',
      description: 'Practical tools and instruments for implementing architectural decisions',
      category: 'Execution Tools',
      date: '2024-01-05',
      readingTime: '6 min',
      tags: ['Tools', 'Implementation', 'Practical'],
      featured: true,
      isNew: false,
      coverImage: '/images/tools-cover.jpg',
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background grid with parallax effect */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-stone-50 via-amber-50/20 to-stone-50"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(212, 175, 55, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(184, 148, 31, 0.03) 0%, transparent 50%),
            linear-gradient(45deg, transparent 49%, rgba(212, 175, 55, 0.05) 49%, rgba(212, 175, 55, 0.05) 51%, transparent 51%),
            linear-gradient(-45deg, transparent 49%, rgba(184, 148, 31, 0.05) 49%, rgba(184, 148, 31, 0.05) 51%, transparent 51%)
          `,
          backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
          transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`
        }}
      />

      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 w-64 h-64 border-t-2 border-l-2 border-amber-900/10" />
      <div className="absolute bottom-0 right-0 w-64 h-64 border-b-2 border-r-2 border-amber-900/10" />

      <div className="container relative mx-auto px-4 py-16 md:py-24">
        {/* Header */}
        <div className="text-center mb-16 md:mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-900/5 border border-amber-900/10 mb-6">
            <span className="text-amber-900/60 text-sm font-medium">Content Portal</span>
            <span className="text-amber-900/40">•</span>
            <span className="text-amber-900/40 text-sm">Structural Access</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-serif font-light text-stone-900 mb-6">
            Architectural <span className="italic">Intelligence</span> Repository
          </h1>
          
          <p className="text-lg md:text-xl text-stone-600 max-w-3xl mx-auto leading-relaxed">
            A curated collection of structural frameworks, strategic instruments, 
            and scholarly materials for architectural thought and execution.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {categories.map((category, index) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              onMouseEnter={() => setHoveredCategory(category.id)}
              onMouseLeave={() => setHoveredCategory(null)}
              className={`
                group relative p-6 rounded-2xl border-2 transition-all duration-500
                ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]
                ${hoveredCategory === category.id 
                  ? 'border-amber-900/30 bg-white shadow-xl' 
                  : 'border-amber-900/10 bg-white/50 hover:border-amber-900/20'
                }
              `}
              style={{ 
                transitionDelay: `${index * 100}ms`,
                borderColor: hoveredCategory === category.id ? `${category.color}40` : undefined
              }}
            >
              {/* Background glow effect */}
              <div 
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ 
                  background: `radial-gradient(circle at center, ${category.color}15 0%, transparent 70%)`,
                }}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform duration-300 group-hover:scale-110"
                    style={{ 
                      backgroundColor: `${category.color}15`,
                      color: category.color,
                      border: `1px solid ${category.color}20`
                    }}
                  >
                    {category.icon}
                  </div>
                  <span 
                    className="text-sm font-medium px-3 py-1 rounded-full"
                    style={{ 
                      backgroundColor: `${category.color}10`,
                      color: category.color
                    }}
                  >
                    {category.count} entries
                  </span>
                </div>

                <h3 className="text-xl font-serif font-medium text-stone-900 mb-2 group-hover:text-amber-900 transition-colors">
                  {category.title}
                </h3>
                
                <p className="text-stone-600 mb-4 leading-relaxed">
                  {category.description}
                </p>

                <div className="flex items-center text-sm text-stone-500">
                  <span className="mr-2">Access →</span>
                  <ChevronDownIcon className="w-4 h-4 transform group-hover:translate-y-1 transition-transform" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Hover Preview Panel */}
        {hoveredCategoryData && (
          <div 
            className={`
              fixed bottom-8 left-1/2 transform -translate-x-1/2
              w-full max-w-4xl px-4 z-40 transition-all duration-500
              ${hoveredCategory ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-amber-900/10 shadow-2xl p-6">
              <div className="flex items-start gap-4">
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ 
                    backgroundColor: `${hoveredCategoryData.color}15`,
                    color: hoveredCategoryData.color,
                    border: `2px solid ${hoveredCategoryData.color}20`
                  }}
                >
                  {hoveredCategoryData.icon}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-serif font-medium text-stone-900">
                      {hoveredCategoryData.title}
                    </h3>
                    <span 
                      className="text-sm font-medium px-3 py-1 rounded-full"
                      style={{ 
                        backgroundColor: `${hoveredCategoryData.color}10`,
                        color: hoveredCategoryData.color
                      }}
                    >
                      {hoveredCategoryData.count} structural entries
                    </span>
                  </div>
                  
                  <p className="text-stone-600 mb-4 text-lg">
                    {hoveredCategoryData.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-900/10">
                      <p className="text-sm text-amber-900/60 mb-1">Subtle Signal</p>
                      <p className="text-stone-700">{hoveredCategoryData.signal.subtle}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-stone-50/50 border border-stone-900/10">
                      <p className="text-sm text-stone-600 mb-1">Texture</p>
                      <p className="text-stone-700 font-medium">{hoveredCategoryData.signal.texture}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Featured Content Preview */}
        <div className="mt-24">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-serif font-light text-stone-900">
                Recently <span className="italic">Structured</span>
              </h2>
              <p className="text-stone-600 mt-2">
                Latest additions to the architectural repository
              </p>
            </div>
            <Link
              href="/content"
              className="px-6 py-3 rounded-full bg-amber-900 text-white font-medium hover:bg-amber-800 transition-colors flex items-center gap-2 group"
            >
              Explore All Content
              <ChevronDownIcon className="w-4 h-4 transform rotate-90 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Featured content cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredContent.map((item, index) => (
              <BaseCard
                key={item.slug}
                slug={item.slug}
                title={item.title}
                description={item.description}
                category={item.category}
                date={item.date}
                readingTime={item.readingTime}
                tags={item.tags}
                featured={item.featured}
                isNew={item.isNew}
                coverImage={item.coverImage}
                className="transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              />
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div className="text-center mt-16 pt-8 border-t border-amber-900/10">
          <p className="text-stone-500 text-sm">
            This portal serves as an index to structural intelligence. 
            Each category represents a distinct architectural dimension of thought.
          </p>
          <p className="text-stone-400 text-xs mt-2">
            Access levels may vary based on subscription tier
          </p>
        </div>
      </div>
    </div>
  );
}
