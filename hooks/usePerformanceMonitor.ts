// hooks/usePerformanceMonitor.ts
import { useEffect, useRef, useCallback } from "react";

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

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

export function usePerformanceMonitor(componentName: string) {
  const mountTimeRef = useRef<number>(0);
  const renderCountRef = useRef<number>(0);
  const lastRenderTimeRef = useRef<number>(0);
  const renderStartTimeRef = useRef<number>(0);

  useEffect(() => {
    const mountTime = now();
    mountTimeRef.current = mountTime;

    const entry: PerformanceEntry = { componentName, timestamp: mountTime, type: "mount" };

    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "performance_component_mount", {
        component_name: componentName,
        mount_time: mountTime,
      });
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`🚀 ${componentName} mounted at ${mountTime.toFixed(2)}ms`);
    }

    return () => {
      const unmountTime = now();
      const totalLifeTime = unmountTime - mountTimeRef.current;

      const unmountEntry: PerformanceEntry = {
        componentName,
        timestamp: unmountTime,
        type: "unmount",
        duration: totalLifeTime,
      };

      void entry;
      void unmountEntry;

      if (process.env.NODE_ENV === "development") {
        console.log(
          `📊 ${componentName} lifetime: ${totalLifeTime.toFixed(2)}ms, Renders: ${renderCountRef.current}`
        );
      }
    };
  }, [componentName]);

  useEffect(() => {
    const t = now();

    if (renderStartTimeRef.current > 0) {
      const renderDuration = t - renderStartTimeRef.current;
      lastRenderTimeRef.current = renderDuration;

      if (process.env.NODE_ENV === "development" && renderDuration > 16) {
        console.warn(`🐢 ${componentName} slow render: ${renderDuration.toFixed(2)}ms`);
      }
    }

    renderCountRef.current += 1;
    renderStartTimeRef.current = t;

    if (renderCountRef.current % 10 === 0) {
      const renderEntry: PerformanceEntry = {
        componentName,
        timestamp: t,
        type: "render",
        duration: lastRenderTimeRef.current,
      };

      void renderEntry;

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
    const totalTime = now() - mountTimeRef.current;
    const avg = renderCountRef.current > 0 ? totalTime / renderCountRef.current : 0;

    return {
      componentName,
      mountTime: mountTimeRef.current,
      renderCount: renderCountRef.current,
      averageRenderTime: avg,
      lastRenderTime: lastRenderTimeRef.current,
    };
  }, [componentName]);

  const markRenderStart = useCallback(() => {
    renderStartTimeRef.current = now();
  }, []);

  const markRenderEnd = useCallback(() => {
    const endTime = now();
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

export function usePagePerformanceMonitor(pageName: string) {
  const pageLoadTimeRef = useRef<number>(0);
  const firstContentfulPaintRef = useRef<number>(0);
  const largestContentfulPaintRef = useRef<number>(0);

  useEffect(() => {
    pageLoadTimeRef.current = now();

    if (typeof window !== "undefined" && "PerformanceObserver" in window) {
      const fcpObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
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
        if (lastEntry) largestContentfulPaintRef.current = lastEntry.startTime;
      });

      try {
        fcpObserver.observe({ type: "paint", buffered: true });
        lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
      } catch (error) {
        console.warn("Performance Observer not supported:", error);
      }

      return () => {
        fcpObserver.disconnect();
        lcpObserver.disconnect();
      };
    }

    return undefined;
  }, [pageName]);

  const getPageMetrics = useCallback(() => {
    const pageLoadTime = now() - pageLoadTimeRef.current;

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
      pageLoadTimeRef.current = now();
    },
  };
}

export default usePerformanceMonitor;