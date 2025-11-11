// components/TableOfContents.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

interface TableOfContentsProps {
  headings: Array<{
    id: string;
    text: string;
    level: number;
  }>;
  className?: string;
  maxDepth?: number;
  showLabels?: boolean;
  smoothScroll?: boolean;
  offset?: number;
  collapseNested?: boolean;
  onHeadingClick?: (headingId: string) => void;
  activeColor?: string;
  inactiveColor?: string;
}

interface HeadingIntersection {
  id: string;
  isIntersecting: boolean;
  element: Element;
}

export default function TableOfContents({
  headings,
  className = "",
  maxDepth = 4,
  showLabels = true,
  smoothScroll = true,
  offset = 20,
  collapseNested = false,
  onHeadingClick,
  activeColor = "text-forest",
  inactiveColor = "text-gray-600",
}: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [visibleHeadings, setVisibleHeadings] = useState<Set<string>>(
    new Set(),
  );
  const [isCollapsed, setIsCollapsed] = useState(collapseNested);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLElement>(null);

  // Filter and validate headings
  const filteredHeadings = React.useMemo(() => {
    if (!headings || !Array.isArray(headings)) {
      console.warn("TableOfContents: headings prop is invalid", headings);
      return [];
    }

    return headings
      .filter((heading) => {
        if (!heading.id || !heading.text) {
          console.warn("TableOfContents: Invalid heading found", heading);
          return false;
        }
        return heading.level <= maxDepth;
      })
      .sort((a, b) => {
        // Sort by DOM order by finding actual elements
        try {
          const elA = document.getElementById(a.id);
          const elB = document.getElementById(b.id);
          if (elA && elB) {
            return elA.compareDocumentPosition(elB) &
              Node.DOCUMENT_POSITION_FOLLOWING
              ? -1
              : 1;
          }
        } catch (error) {
          console.warn("TableOfContents: Error sorting headings", error);
        }
        return 0;
      });
  }, [headings, maxDepth]);

  // Set up intersection observer for active heading detection
  useEffect(() => {
    if (filteredHeadings.length === 0) return;

    const headingElements = filteredHeadings
      .map((heading) => document.getElementById(heading.id))
      .filter(Boolean) as Element[];

    if (headingElements.length === 0) {
      console.warn("TableOfContents: No heading elements found in DOM");
      return;
    }

    const handleIntersect: IntersectionObserverCallback = (entries) => {
      const newVisibleHeadings = new Set(visibleHeadings);

      entries.forEach((entry) => {
        const id = entry.target.id;
        if (entry.isIntersecting) {
          newVisibleHeadings.add(id);
        } else {
          newVisibleHeadings.delete(id);
        }
      });

      setVisibleHeadings(newVisibleHeadings);

      // Determine active heading based on visibility and position
      const visibleArray = Array.from(newVisibleHeadings);
      if (visibleArray.length > 0) {
        // Get the topmost visible heading
        const topHeading = visibleArray.reduce((topId, currentId) => {
          const topEl = document.getElementById(topId);
          const currentEl = document.getElementById(currentId);
          if (!topEl || !currentEl) return topId;

          const topRect = topEl.getBoundingClientRect();
          const currentRect = currentEl.getBoundingClientRect();

          return currentRect.top < topRect.top ? currentId : topId;
        }, visibleArray[0]);

        setActiveId(topHeading);
      }
    };

    // Throttle intersection updates
    const throttledHandleIntersect: IntersectionObserverCallback = (
      entries,
    ) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => handleIntersect(entries), 100);
    };

    try {
      observerRef.current = new IntersectionObserver(throttledHandleIntersect, {
        rootMargin: `-${offset}px 0px -60% 0px`,
        threshold: 0.1,
      });

      headingElements.forEach((element) => {
        observerRef.current?.observe(element);
      });
    } catch (error) {
      console.error(
        "TableOfContents: Error setting up intersection observer",
        error,
      );
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [filteredHeadings, offset]);

  // Handle smooth scrolling to headings
  const handleHeadingClick = useCallback(
    (event: React.MouseEvent, headingId: string) => {
      event.preventDefault();

      try {
        const targetElement = document.getElementById(headingId);
        if (!targetElement) {
          console.warn(
            `TableOfContents: Target element not found: ${headingId}`,
          );
          return;
        }

        // Call custom click handler
        onHeadingClick?.(headingId);

        // Calculate scroll position with offset
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        // Smooth scroll with fallback
        if (
          smoothScroll &&
          "scrollBehavior" in document.documentElement.style
        ) {
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        } else {
          window.scrollTo(0, offsetPosition);
        }

        // Update URL hash without scrolling
        window.history.pushState(null, "", `#${headingId}`);

        // Focus the heading for accessibility
        targetElement.setAttribute("tabindex", "-1");
        targetElement.focus({ preventScroll: true });

        // Remove tabindex after focus
        setTimeout(() => {
          targetElement.removeAttribute("tabindex");
        }, 1000);
      } catch (error) {
        console.error("TableOfContents: Error scrolling to heading", error);
        // Fallback: regular anchor behavior
        window.location.hash = headingId;
      }
    },
    [smoothScroll, offset, onHeadingClick],
  );

  // Keyboard navigation support
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, headingId: string) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleHeadingClick(event as unknown as React.MouseEvent, headingId);
      }
    },
    [handleHeadingClick],
  );

  // Get heading padding based on level
  const getHeadingPadding = useCallback((level: number) => {
    const basePadding = 0.75; // rem
    return { paddingLeft: `${(level - 2) * basePadding}rem` };
  }, []);

  // Determine if heading should be visible (for collapsed mode)
  const shouldShowHeading = useCallback(
    (index: number) => {
      if (!isCollapsed) return true;

      const currentHeading = filteredHeadings[index];
      if (currentHeading.level === 2) return true;

      // Show nested headings only if parent is active
      let parentIndex = index - 1;
      while (parentIndex >= 0) {
        if (filteredHeadings[parentIndex].level < currentHeading.level) {
          return activeId === filteredHeadings[parentIndex].id;
        }
        parentIndex--;
      }

      return false;
    },
    [isCollapsed, filteredHeadings, activeId],
  );

  // Early return if no valid headings
  if (filteredHeadings.length === 0) {
    return null;
  }

  return (
    <nav
      ref={containerRef}
      className={`
        toc sticky top-6
        max-h-[calc(100vh-2rem)] overflow-y-auto
        scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent
        hover:scrollbar-thumb-gray-400
        ${className}
      `.trim()}
      aria-label="Table of contents"
      role="navigation"
    >
      {/* Header with collapse toggle */}
      <div className="flex items-center justify-between mb-3">
        {showLabels && (
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex-1">
            On this page
          </h3>
        )}

        {collapseNested && filteredHeadings.some((h) => h.level > 2) && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`
              ml-2 p-1 rounded text-xs font-medium transition-colors
              focus:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-1
              ${
                isCollapsed
                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  : "bg-forest/10 text-forest hover:bg-forest/20"
              }
            `}
            aria-label={
              isCollapsed ? "Expand all sections" : "Collapse nested sections"
            }
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? "Expand" : "Collapse"}
          </button>
        )}
      </div>

      {/* Progress indicator */}
      <div className="w-full bg-gray-200 rounded-full h-1 mb-4">
        <div
          className="bg-forest h-1 rounded-full transition-all duration-300"
          style={{
            width: `${((filteredHeadings.findIndex((h) => h.id === activeId) + 1) / filteredHeadings.length) * 100}%`,
          }}
          aria-hidden="true"
        />
      </div>

      {/* Headings list */}
      <ul className="space-y-1 text-sm" role="list">
        {filteredHeadings.map((heading, index) => {
          const isActive = activeId === heading.id;
          const isVisible = shouldShowHeading(index);

          if (!isVisible) return null;

          return (
            <li
              key={heading.id}
              style={getHeadingPadding(heading.level)}
              className="transition-all duration-200"
            >
              <a
                href={`#${heading.id}`}
                onClick={(e) => handleHeadingClick(e, heading.id)}
                onKeyDown={(e) => handleKeyDown(e, heading.id)}
                className={`
                  block py-1.5 px-2 rounded-md border-l-2 transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-1
                  hover:bg-gray-50 hover:translate-x-0.5
                  ${
                    isActive
                      ? `${activeColor} font-medium bg-forest/5 border-l-forest`
                      : `${inactiveColor} border-l-transparent hover:border-l-gray-300`
                  }
                  motion-reduce:transform-none
                `.trim()}
                aria-current={isActive ? "location" : undefined}
                data-heading-level={heading.level}
              >
                <span className="flex items-center">
                  {heading.level > 2 && (
                    <span
                      className="w-1 h-1 rounded-full bg-current opacity-50 mr-2 flex-shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <span className="truncate">{heading.text}</span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>

      {/* Empty state for collapsed mode */}
      {isCollapsed &&
        filteredHeadings.filter((_, index) => shouldShowHeading(index))
          .length === 0 && (
          <p className="text-xs text-gray-500 italic text-center py-4">
            Select a section to view subsections
          </p>
        )}
    </nav>
  );
}

// Hook for extracting headings from DOM
export function useHeadingsExtractor(selector: string = "h2, h3, h4, h5, h6") {
  const [headings, setHeadings] = useState<
    Array<{ id: string; text: string; level: number }>
  >([]);

  useEffect(() => {
    const extractHeadings = () => {
      try {
        const headingElements = Array.from(document.querySelectorAll(selector));
        const extractedHeadings = headingElements
          .map((element) => {
            const id =
              element.id ||
              element.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, "-") ||
              "";
            const text = element.textContent?.trim() || "";
            const level = parseInt(element.tagName.substring(1), 10);

            // Ensure element has an ID for linking
            if (!element.id && text) {
              const generatedId = text
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-");
              element.id = generatedId;
            }

            return { id: element.id, text, level };
          })
          .filter((heading) => heading.id && heading.text);

        setHeadings(extractedHeadings);
      } catch (error) {
        console.error("Error extracting headings:", error);
        setHeadings([]);
      }
    };

    // Initial extraction
    extractHeadings();

    // Set up MutationObserver to watch for DOM changes
    const observer = new MutationObserver(extractHeadings);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [selector]);

  return headings;
}

// Higher-order component for automatic heading extraction
export function withTableOfContents<P extends object>(
  Component: React.ComponentType<P>,
  options: { selector?: string } = {},
) {
  return function TableOfContentsWrapper(props: P) {
    const headings = useHeadingsExtractor(options.selector);

    return (
      <div className="relative">
        <Component {...props} />
        {headings.length > 0 && (
          <div className="hidden xl:block absolute right-0 top-0 w-64">
            <TableOfContents headings={headings} />
          </div>
        )}
      </div>
    );
  };
}
