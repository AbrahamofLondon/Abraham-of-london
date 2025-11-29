// types/contentlayer.d.ts
declare module "contentlayer/cli" {
  export interface CliOptions {
    configPath?: string;
    verbose?: boolean;
    watch?: boolean;
  }

  export function run(options?: CliOptions): Promise<void>;
}

declare module "contentlayer/core" {
  export interface BuildOptions {
    configPath?: string;
    verbose?: boolean;
  }

  export function build(options: BuildOptions): Promise<void>;
}
