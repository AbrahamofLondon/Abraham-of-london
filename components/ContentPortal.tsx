// components/ContentPortal.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Category {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  count: number;
  signal: { subtle: string; texture: string };
  latestItems: any[];
}

export function ContentPortal() {
  const router = useRouter();
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [hoveredCategory, setHoveredCategory] = React.useState<string | null>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    // Simulate fetching data - in reality, you'd fetch from your API
    const mockCategories: Category[] = [
      {
        id: 'strategic-insights',
        title: 'Strategic Insights',
        description: 'Architectural thinking for complex systems',
        icon: '↗',
        color: '#d4af37',
        count: 24,
        signal: { subtle: 'Structural principles for decision-making', texture: 'architectural' },
        latestItems: []
      },
      {
        id: 'curated-volumes',
        title: 'Curated Volumes',
        description: 'Complete frameworks in bound form',
        icon: '📚',
        color: '#b8941f',
        count: 12,
        signal: { subtle: 'Comprehensive architectural systems', texture: 'bound' },
        latestItems: []
      },
      {
        id: 'execution-tools',
        title: 'Execution Tools',
        description: 'Instruments for implementation',
        icon: '⚙',
        color: '#9c7c1a',
        count: 18,
        signal: { subtle: 'Applied architectural instruments', texture: 'instrument' },
        latestItems: []
      },
      {
        id: 'scholarly-gatherings',
        title: 'Scholarly Gatherings',
        description: 'Live architectural discourse',
        icon: '𓇯',
        color: '#806515',
        count: 8,
        signal: { subtle: 'Live structural conversations', texture: 'gathering' },
        latestItems: []
      },
      {
        id: 'print-editions',
        title: 'Print Editions',
        description: 'Physical manifestations of structure',
        icon: '𓍯',
        color: '#645010',
        count: 6,
        signal: { subtle: 'Tactile architectural expressions', texture: 'physical' },
        latestItems: []
      },
      {
        id: 'scholars-toolkit',
        title: 'Scholar\'s Toolkit',
        description: 'Supplementary structural materials',
        icon: '☿',
        color: '#48390b',
        count: 14,
        signal: { subtle: 'Auxiliary structural components', texture: 'supplementary' },
        latestItems: []
      }
    ];
    
    setCategories(mockCategories);
    
    // Animation delay
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    // Animate before navigation
    const element = document.getElementById(categoryId);
    if (element) {
      element.classList.add('scale-105');
      setTimeout(() => {
        router.push(`/content?category=${categoryId}`);
      }, 200);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Architectural Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a]" />
        
        {/* Structural Grid */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(212, 175, 55, 0.1) 1px, transparent 1px),
              linear-gradient(rgba(212, 175, 55, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px'
          }}
        />
        
        {/* Dynamic Gradient */}
        <div 
          className="absolute inset-0 transition-opacity duration-1000"
          style={{
            background: hoveredCategory 
              ? `radial-gradient(circle at 30% 50%, ${hoveredCategory}08 0%, transparent 70%)`
              : 'radial-gradient(circle at 30% 50%, rgba(212, 175, 55, 0.03) 0%, transparent 70%)'
          }}
        />
      </div>

      {/* Main Container */}
      <div className={`relative mx-auto max-w-7xl px-4 py-24 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-4 mb-8">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#d4af37]/30" />
            <span className="text-sm tracking-[0.3em] uppercase text-[#d4af37]/70">
              The Structural Collection
            </span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#d4af37]/30" />
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-6">
            Architectural
            <span className="block mt-2 text-[#d4af37] font-medium">Content Portals</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg text-[#999] leading-relaxed">
            Six structural approaches to understanding and applying systematic thinking.
            Each portal offers a distinct architectural perspective on purpose, civilisation, and human flourishing.
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <div
              key={category.id}
              id={category.id}
              onMouseEnter={() => setHoveredCategory(category.color)}
              onMouseLeave={() => setHoveredCategory(null)}
              onClick={() => handleCategoryClick(category.id)}
              className={`group relative cursor-pointer transition-all duration-500 hover:scale-[1.02] ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ 
                transitionDelay: `${index * 100}ms`,
                backgroundColor: `${category.color}05`
              }}
            >
              {/* Card Container */}
              <div className="relative h-full border border-[#2a2a2a] rounded-xl p-6 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500"
                  style={{
                    backgroundImage: `radial-gradient(circle at 20% 80%, ${category.color} 0%, transparent 50%)`
                  }}
                />
                
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t border-l border-[#2a2a2a] rounded-tl-xl" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b border-r border-[#2a2a2a] rounded-br-xl" />

                {/* Content */}
                <div className="relative">
                  {/* Icon and Count */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="text-3xl opacity-70 group-hover:opacity-100 transition-opacity">
                      {category.icon}
                    </div>
                    <div className="text-sm px-3 py-1 rounded-full border border-[#2a2a2a]"
                      style={{ color: category.color }}>
                      {category.count} structures
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-medium mb-3 group-hover:text-[#fff] transition-colors"
                    style={{ color: category.color }}>
                    {category.title}
                  </h3>

                  {/* Description */}
                  <p className="text-[#999] text-sm leading-relaxed mb-6">
                    {category.description}
                  </p>

                  {/* Signal */}
                  <div className="text-xs text-[#666] group-hover:text-[#888] transition-colors">
                    {category.signal.subtle}
                  </div>

                  {/* Interactive Elements */}
                  <div className="mt-8 pt-6 border-t border-[#2a2a2a] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: category.color }} />
                      <span className="text-xs text-[#666]">Active Portal</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-sm"
                      style={{ color: category.color }}>
                      <span className="opacity-70 group-hover:opacity-100 transition-opacity">
                        Enter
                      </span>
                      <span className="transform transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[#0a0a0a] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                {/* Glow Effect */}
                <div className="absolute -inset-4 opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at center, ${category.color}30 0%, transparent 70%)`
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* All Content Portal */}
        <div className={`mt-12 transition-all duration-1000 delay-700 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <Link
            href="/content"
            className="group relative block border border-[#2a2a2a] rounded-xl p-8 overflow-hidden hover:border-[#d4af37]/30 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#1a1a1a] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-2xl text-[#d4af37]">∞</div>
                  <h3 className="text-xl font-medium">Complete Structural Collection</h3>
                </div>
                <p className="text-[#999] max-w-xl">
                  Access the entire architectural library. All portals, all structures, 
                  all thinking in one unified interface.
                </p>
              </div>
              
              <div className="flex items-center gap-3 text-[#d4af37]">
                <span className="text-sm">Open Full Collection</span>
                <span className="transform transition-transform group-hover:translate-x-2">↠</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Stats Footer */}
        <div className={`mt-16 pt-8 border-t border-[#2a2a2a] transition-all duration-1000 delay-900 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: 'Total Structures', value: '82' },
              { label: 'Active Portals', value: '6' },
              { label: 'Architectural Layers', value: '12' },
              { label: 'Structural Depth', value: '7' }
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-2xl font-light text-[#d4af37] mb-2">{stat.value}</div>
                <div className="text-sm text-[#666]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50">
        <div className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-[#d4af37]/5 to-transparent blur-3xl"
          style={{
            transform: hoveredCategory 
              ? `translate(var(--mouse-x, 0px), var(--mouse-y, 0px)) scale(1.5)`
              : `translate(var(--mouse-x, 0px), var(--mouse-y, 0px)) scale(1)`,
            transition: 'transform 0.3s ease-out',
          }}
        />
      </div>

      {/* Mouse Tracking Script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('mousemove', (e) => {
              document.documentElement.style.setProperty('--mouse-x', e.clientX + 'px');
              document.documentElement.style.setProperty('--mouse-y', e.clientY + 'px');
            });
          `
        }}
      />
    </div>
  );
}