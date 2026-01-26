"use client";

import * as React from "react";
import { 
  safeString, 
  safeNumber,
  safeGet,
  classNames 
} from "@/lib/utils/safe";
import { ChevronRight, Navigation, Hash } from "lucide-react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  contentRef?: React.RefObject<HTMLElement>;
  className?: string;
  maxHeadings?: number;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ 
  contentRef, 
  className = "",
  maxHeadings = 50
}) => {
  const [headings, setHeadings] = React.useState<Heading[]>([]);
  const [activeId, setActiveId] = React.useState<string>("");
  const [isClient, setIsClient] = React.useState(false);

  // Safe heading level extraction
  const getHeadingLevel = (heading: Element): number => {
    const tagName = safeString(heading?.tagName).toUpperCase();
    const match = tagName.match(/^H([1-6])$/);
    
    if (match) {
      const level = safeNumber(match[1], 2);
      return level >= 1 && level <= 6 ? level : 2;
    }
    
    return 2; // Default to H2
  };

  React.useEffect(() => {
    setIsClient(true);
    
    if (!isClient) return;

    const element = contentRef?.current || document;
    
    const extractHeadings = () => {
      try {
        const selector = 'h2, h3, h4, h5';
        const headingElements = element.querySelectorAll(selector);
        const extracted: Heading[] = [];
        
        headingElements.forEach((heading, index) => {
          if (index >= maxHeadings) return;
          
          const text = safeString(heading.textContent);
          if (!text.trim()) return;
          
          let id = heading.id;
          if (!id) {
            // Generate a safe ID
            id = `section-${index}-${text
              .toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-')
              .substring(0, 50)}`;
            
            try {
              heading.id = id;
            } catch {
              // Silent fail if we can't set ID
            }
          }
          
          const level = getHeadingLevel(heading);
          extracted.push({ id, text, level });
        });
        
        setHeadings(extracted);
      } catch (error) {
        console.warn('Error extracting headings:', error);
        setHeadings([]);
      }
    };
    
    const observer = new IntersectionObserver(
      (entries) => {
        try {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const id = safeString(entry.target.id);
              if (id) {
                setActiveId(id);
              }
            }
          });
        } catch (error) {
          console.warn('Error observing headings:', error);
        }
      },
      { 
        root: null,
        rootMargin: '-20% 0% -70% 0%',
        threshold: 0.1
      }
    );
    
    // Wait for content to be ready
    const timeoutId = setTimeout(() => {
      extractHeadings();
      
      try {
        const headingElements = element.querySelectorAll('h2, h3, h4, h5');
        headingElements.forEach((heading) => {
          observer.observe(heading);
        });
      } catch (error) {
        console.warn('Error observing headings:', error);
      }
    }, 300);
    
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [contentRef, isClient, maxHeadings]);

  const scrollToHeading = React.useCallback((id: string, event: React.MouseEvent) => {
    event.preventDefault();
    
    if (!isClient) return;
    
    try {
      const element = document.getElementById(id);
      if (element) {
        const offset = 120;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        
        // Update URL without page reload
        window.history.pushState({}, '', `#${id}`);
        setActiveId(id);
      }
    } catch (error) {
      console.warn('Error scrolling to heading:', error);
    }
  }, [isClient]);

  if (!isClient || headings.length === 0) {
    return (
      <aside className={classNames("sticky top-24", className)}>
        <div className="rounded-xl bg-gradient-to-br from-gray-50 to-white p-6 border border-gray-200/80 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-100 to-blue-50">
              <Navigation className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Navigation</h3>
          </div>
          <p className="text-sm text-gray-500 text-center py-8">
            Table of contents will appear here
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className={classNames("sticky top-24", className)}>
      <nav className="rounded-xl bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-sm p-6 border border-gray-200/80 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10">
            <Navigation className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">In This Article</h3>
            <p className="text-xs text-gray-500 mt-1">{headings.length} sections</p>
          </div>
        </div>
        
        <div className="relative pl-3 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-blue-200 before:via-purple-200 before:to-blue-200">
          <ul className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
            {headings.map((heading) => {
              const isActive = activeId === heading.id;
              const indent = heading.level === 3 ? 'pl-4' : heading.level >= 4 ? 'pl-8' : '';
              
              return (
                <li key={heading.id} className={indent}>
                  <a
                    href={`#${heading.id}`}
                    onClick={(e) => scrollToHeading(heading.id, e)}
                    className={classNames(
                      "group flex items-center gap-3 text-sm transition-all duration-200 py-1.5 px-2 rounded-lg",
                      isActive 
                        ? "text-blue-600 font-medium bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-100 shadow-sm" 
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/50 border border-transparent"
                    )}
                  >
                    <div className={classNames(
                      "flex-shrink-0 transition-all duration-200 rounded-full",
                      isActive 
                        ? "w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-purple-500 shadow-sm" 
                        : "w-1.5 h-1.5 bg-gray-300 group-hover:bg-gray-400"
                    )} />
                    
                    <span className="line-clamp-2 leading-relaxed flex-1">
                      {heading.text}
                    </span>
                    
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 animate-pulse" />
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200/60">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse" />
              <span>Currently reading</span>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
              {(headings.findIndex(h => h.id === activeId) + 1) || 0} of {headings.length}
            </span>
          </div>
        </div>
      </nav>
      
      <style jsx>{`
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: #CBD5E0 #F7FAFC;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #F7FAFC;
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #CBD5E0;
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #A0AEC0;
        }
      `}</style>
    </aside>
  );
};

// Safe SSR version
export const SafeTableOfContents: React.FC<TableOfContentsProps> = (props) => {
  const [isClient, setIsClient] = React.useState(false);
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return (
      <div className="sticky top-24">
        <div className="rounded-xl bg-gradient-to-br from-gray-50 to-white p-6 border border-gray-200/80 shadow-sm animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-3 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return <TableOfContents {...props} />;
};

export default TableOfContents;