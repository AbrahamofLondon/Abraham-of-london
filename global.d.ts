// global.d.ts

// images
declare module "*.png" {
    const src: string;
    export default src;
}
declare module "*.jpg" {
    const src: string;
    export default src;
}
declare module "*.jpeg" {
    const src: string;
    export default src;
}
declare module "*.webp" {
    const src: string;
    export default src;
}
declare module "*.gif" {
    const src: string;
    export default src;
}
declare module "*.avif" {
    const src: string;
    export default src;
}

// svg as url + React component
declare module "*.svg" {
    import * as React from "react";
    export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
    const src: string;
    export default src;
}

// styles (only if some files import CSS modules in TS)
declare module "*.css" {
    const classes: { [k: string]: string };
    export default classes;
}
declare module "*.module.css" {
    const classes: { [k: string]: string };
    export default classes;
}
declare module "*.module.scss" {
    const classes: { [k: string]: string };
    export default classes;
}
declare module "*.scss" {
    const classes: { [k: string]: string };
    export default classes;
}

// MDX files as React components + optional frontmatter
declare module "*.mdx" {
    import * as React from "react";
    let MDXComponent: React.ComponentType<any>;
    export const frontMatter: Record<string, any> | undefined;
    export default MDXComponent;
}