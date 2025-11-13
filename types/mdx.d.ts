// types/mdx.d.ts
declare module 'mdx/types' {
  export interface MDXComponents {
    [key: string]: React.ComponentType<any>;
  }
}

declare module '*.mdx' {
  let MDXComponent: (props: any) => JSX.Element;
  export default MDXComponent;
}