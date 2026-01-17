// patches/dynamic-imports.d.ts
declare module "next/dynamic" {
  import { ComponentType } from "react";
  
  interface DynamicOptions<P = {}> {
    loader?: () => Promise<ComponentType<P> | { default: ComponentType<P> }>;
    loading?: ComponentType<{ error?: Error; isLoading?: boolean; pastDelay?: boolean; timedOut?: boolean }>;
    ssr?: boolean;
    loadableGenerated?: {
      webpack?(): any;
      modules?(): string[];
    };
  }
  
  function dynamic<P = {}>(
    loader: () => Promise<ComponentType<P> | { default: ComponentType<P> }>,
    options?: DynamicOptions<P>
  ): ComponentType<P>;
  
  export default dynamic;
}
