// hooks/index.ts
export { useWebSocket } from "./useWebSocket";
export { usePerformanceMonitor, usePagePerformanceMonitor } from "./usePerformanceMonitor";

// Central exports for all hooks.
// This lets you `import { useWebSocket, usePerformanceMonitor } from "@/hooks";`

// If you add more hooks later, export them here:
// export { useSomething } from "./useSomething";