declare module "next-mdx-remote" {
  import type * as React from "react";

  export interface MDXRemoteSerializeResult<
    TScope = Record<string, unknown>,
    TFrontmatter = Record<string, unknown>,
  > {
    compiledSource: string;
    scope?: TScope;
    frontmatter?: TFrontmatter;
  }

  export interface MDXRemoteProps extends MDXRemoteSerializeResult {
    components?: Record<string, React.ComponentType<any>>;
    lazy?: boolean;
  }

  export function MDXRemote(
    props: MDXRemoteProps,
  ): React.ReactElement | null;
}
