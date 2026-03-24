declare module "next-mdx-remote/serialize" {
  import type { MDXRemoteSerializeResult } from "next-mdx-remote";

  export function serialize(
    source: string,
    options?: {
      scope?: Record<string, unknown>;
      mdxOptions?: Record<string, unknown>;
      parseFrontmatter?: boolean;
    }
  ): Promise<MDXRemoteSerializeResult>;
}