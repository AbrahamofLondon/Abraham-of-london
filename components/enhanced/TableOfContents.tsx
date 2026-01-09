"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  contentRef?: React.RefObject<HTMLElement>;
  className?: string;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ 
  contentRef, 
  className = "" 
}) => {
  const [headings, setHeadings] = React.useState<Heading[]>([]);
  const [activeId, setActiveId] = React.useState<string>("");

  React.useEffect(() => {
    const element = contentRef?.current || document;
    
    const extractHeadings = () => {
      const headingElements = element.querySelectorAll('h2, h3');
      const extracted: Heading[] = [];
      
      headingElements.forEach((heading, index) => {
        const id = heading.id || `heading-${index}`;
        const text = heading.textContent || "";
        const level = parseInt(heading.tagName.charAt(1));
        
        if (!heading.id) {
          heading.id = id;
        }
        
        extracted.push({ id, text, level });
      });
      
      setHeadings(extracted);
    };
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0% -70% 0%' }
    );
    
    // Wait a tick for content to load
    setTimeout(() => {
      extractHeadings();
      
      const headingElements = element.querySelectorAll('h2, h3');
      headingElements.forEach((heading) => {
        observer.observe(heading);
      });
    }, 100);
    
    return () => observer.disconnect();
  }, [contentRef]);

  if (headings.length === 0) return null;

  const scrollToHeading = (id: string, event: React.MouseEvent) => {
    event.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      // Update URL without page reload
      window.history.pushState({}, '', `#${id}`);
    }
  };

  return (
    <aside className={`sticky top-24 ${className}`}>
      <nav className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200/80 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
          <h3 className="font-semibold text-gray-900 text-lg">Navigation</h3>
        </div>
        
        <div className="relative pl-3 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-gray-200 before:via-gray-300 before:to-gray-200">
          <ul className="space-y-2.5">
            {headings.map((heading) => {
              const isActive = activeId === heading.id;
              const indent = heading.level === 3 ? 'pl-4' : '';
              
              return (
                <li key={heading.id} className={`${indent} group`}>
                  <a
                    href={`#${heading.id}`}
                    onClick={(e) => scrollToHeading(heading.id, e)}
                    className={`
                      flex items-center gap-2 text-sm transition-all duration-200
                      ${isActive 
                        ? 'text-blue-600 font-medium translate-x-1' 
                        : 'text-gray-600 hover:text-gray-900 hover:translate-x-1'
                      }
                    `}
                  >
                    <div className={`
                      flex-shrink-0 transition-all duration-200
                      ${isActive 
                        ? 'w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full' 
                        : 'w-1.5 h-1.5 bg-gray-300 rounded-full group-hover:bg-gray-400'
                      }
                    `} />
                    
                    <span className="line-clamp-2 leading-relaxed">
                      {heading.text}
                    </span>
                    
                    {isActive && (
                      <ChevronRight className="w-3 h-3 text-blue-500 flex-shrink-0 ml-auto" />
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200/60">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-blue-400 rounded-full" />
            <span>Currently reading</span>
          </div>
        </div>
      </nav>
    </aside>
  );
};

// Safe SSR version
export const SafeTableOfContents: React.FC<TableOfContentsProps> = (props) => {
  const [isClient, setIsClient] = React.useState(false);
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) return null;
  
  return <TableOfContents {...props} />;
};