// types/next-mdx-remote.d.ts

declare module 'next-mdx-remote/serialize' {
  export interface SerializeOptions {
    mdxOptions?: Record<string, unknown>;
    scope?: Record<string, unknown>;
    parseFrontmatter?: boolean;
  }
  export function serialize(
    source: string,
    options?: SerializeOptions
  ): Promise<any>;
}

declare module 'next-mdx-remote' {
  import * as React from 'react';

  export type MDXRemoteSerializeResult = any;

  export interface MDXRemoteProps {
    compiledSource?: string;
    scope?: Record<string, unknown>;
    frontmatter?: Record<string, unknown>;
    components?: Record<string, React.ComponentType<any>>;
    [key: string]: any;
  }

  export const MDXRemote: React.ComponentType<MDXRemoteProps>;
}





