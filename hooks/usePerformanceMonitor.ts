// hooks/usePerformanceMonitor.ts
import { useEffect, useRef, useCallback } from 'react'; // Fixed import

interface PerformanceMetrics {
  componentName: string;
  mountTime: number;
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
}

interface PerformanceEntry {
  componentName: string;
  timestamp: number;
  type: "mount" | "render" | "unmount";
  duration?: number;
}

export function usePerformanceMonitor(componentName: string) {
  const mountTimeRef = useRef<number>(0);
  const renderCountRef = useRef<number>(0);
  const lastRenderTimeRef = useRef<number>(0);
  const renderStartTimeRef = useRef<number>(0);

  // Measure component mount time
  useEffect(() => {
    mountTimeRef.current = performance.now();
    const mountTime = performance.now();

    // Log mount performance
    const entry: PerformanceEntry = {
      componentName,
      timestamp: mountTime,
      type: "mount",
    };

    // Send to analytics if available
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "performance_component_mount", {
        component_name: componentName,
        mount_time: mountTime,
      });
    }

    // Console log in development
    if (process.env.NODE_ENV === "development") {
      console.log(`🚀 ${componentName} mounted in ${mountTime.toFixed(2)}ms`);
    }

    // Cleanup on unmount
    return () => {
      const unmountTime = performance.now();
      const totalLifeTime = unmountTime - mountTimeRef.current;

      const unmountEntry: PerformanceEntry = {
        componentName,
        timestamp: unmountTime,
        type: "unmount",
        duration: totalLifeTime,
      };

      if (process.env.NODE_ENV === "development") {
        console.log(
          `📊 ${componentName} lifetime: ${totalLifeTime.toFixed(2)}ms, Renders: ${renderCountRef.current}`,
        );
      }
    };
  }, [componentName]);

  // Measure render performance
  useEffect(() => {
    const now = performance.now();

    // Calculate render duration if this is not the first render
    if (renderStartTimeRef.current > 0) {
      const renderDuration = now - renderStartTimeRef.current;
      lastRenderTimeRef.current = renderDuration;

      if (process.env.NODE_ENV === "development" && renderDuration > 16) {
        // Warn about slow renders (> 16ms = 60fps)
        console.warn(
          `🐢 ${componentName} slow render: ${renderDuration.toFixed(2)}ms`,
        );
      }
    }

    renderCountRef.current += 1;
    renderStartTimeRef.current = now;

    // Log render performance periodically
    if (renderCountRef.current % 10 === 0) {
      const renderEntry: PerformanceEntry = {
        componentName,
        timestamp: now,
        type: "render",
        duration: lastRenderTimeRef.current,
      };

      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "performance_component_render", {
          component_name: componentName,
          render_count: renderCountRef.current,
          last_render_time: lastRenderTimeRef.current,
        });
      }
    }
  });

  const getMetrics = useCallback((): PerformanceMetrics => {
    const totalTime = performance.now() - mountTimeRef.current;
    const averageRenderTime =
      renderCountRef.current > 0 ? totalTime / renderCountRef.current : 0;

    return {
      componentName,
      mountTime: mountTimeRef.current,
      renderCount: renderCountRef.current,
      averageRenderTime,
      lastRenderTime: lastRenderTimeRef.current,
    };
  }, [componentName]);

  const markRenderStart = useCallback(() => {
    renderStartTimeRef.current = performance.now();
  }, []);

  const markRenderEnd = useCallback(() => {
    const endTime = performance.now();
    const renderTime = endTime - renderStartTimeRef.current;
    lastRenderTimeRef.current = renderTime;
    return renderTime;
  }, []);

  return {
    getMetrics,
    markRenderStart,
    markRenderEnd,
    renderCount: renderCountRef.current,
    lastRenderTime: lastRenderTimeRef.current,
  };
}

// Enhanced performance monitoring for page-level metrics
export function usePagePerformanceMonitor(pageName: string) {
  const pageLoadTimeRef = useRef<number>(0);
  const firstContentfulPaintRef = useRef<number>(0);
  const largestContentfulPaintRef = useRef<number>(0);

  useEffect(() => {
    // Mark page load start
    pageLoadTimeRef.current = performance.now();

    // Track First Contentful Paint
    if (typeof window !== "undefined" && "PerformanceObserver" in window) {
      const fcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        for (const entry of entries) {
          if (entry.name === "first-contentful-paint") {
            firstContentfulPaintRef.current = entry.startTime;

            if (process.env.NODE_ENV === "development") {
              console.log(`🎨 FCP: ${entry.startTime.toFixed(2)}ms`);
            }
          }
        }
      });

      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        largestContentfulPaintRef.current = lastEntry?.startTime || 0;
      });

      try {
        fcpObserver.observe({ type: "paint", buffered: true });
        lcpObserver.observe({
          type: "largest-contentful-paint",
          buffered: true,
        });
      } catch (e) {
        console.warn("Performance Observer not supported:", e);
      }

      return () => {
        fcpObserver.disconnect();
        lcpObserver.disconnect();
      };
    }
  }, [pageName]);

  const getPageMetrics = useCallback(() => {
    const pageLoadTime = performance.now() - pageLoadTimeRef.current;

    return {
      pageName,
      pageLoadTime,
      firstContentfulPaint: firstContentfulPaintRef.current,
      largestContentfulPaint: largestContentfulPaintRef.current,
      timestamp: new Date().toISOString(),
    };
  }, [pageName]);

  return {
    getPageMetrics,
    markPageLoad: () => {
      pageLoadTimeRef.current = performance.now();
    },
  };
}

export default usePerformanceMonitor;