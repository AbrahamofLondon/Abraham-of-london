import * as React from "react";
import type { CompileMdxFn } from "./types";

export function createNextContentlayerCompile(
  useMDXComponentHook: (code: string) => React.ComponentType<{ components?: Record<string, any> }>,
): CompileMdxFn {
  return (code: string) => useMDXComponentHook(code);
}
