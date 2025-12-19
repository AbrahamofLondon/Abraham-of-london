/* components/mdx-components.tsx */
import * as React from "react";
import * as Lucide from "lucide-react";

import Divider from "./Divider";
import Rule from "./Rule";
import Grid from "./Grid";
import PullLine from "./mdx/PullLine";

import Callout from "./Callout";
import Quote from "./Quote";
import { Note } from "./Note";
import Caption from "./mdx/Caption";

import CanonReference from "./CanonReference";
import GlossaryTerm from "./GlossaryTerm";

import EmbossedBrandMark from "./EmbossedBrandMark";
import EmbossedSign from "./print/EmbossedSign";

const baseComponents: Record<string, any> = {
  h1: (props: any) => (
    <h1 className="mt-16 mb-8 font-serif text-4xl font-semibold text-white" {...props} />
  ),
  p: (props: any) => <p className="my-6 text-lg leading-relaxed text-gray-300" {...props} />,

  Divider,
  Rule,
  Grid,
  PullLine,
  Callout,
  Quote,
  Note,
  Caption,
  CanonReference,
  GlossaryTerm,
  EmbossedBrandMark,
  EmbossedSign,

  Icon: ({ name, size = 20, ...props }: any) => {
    const LucideIcon = (Lucide as any)[name];
    return LucideIcon ? <LucideIcon size={size} {...props} /> : null;
  },
};

export const mdxComponents = new Proxy(baseComponents, {
  get(target, prop: string) {
    if (typeof prop !== "string") return (target as any)[prop];

    // exact
    if ((target as any)[prop]) return (target as any)[prop];

    // case-insensitive match
    const foundKey = Object.keys(target).find((k) => k.toLowerCase() === prop.toLowerCase());
    if (foundKey) return (target as any)[foundKey];

    // unknown MDX element/component name:
    // render children but preserve props to avoid breaking layouts.
    return (props: any) => <span {...props}>{props?.children}</span>;
  },
});

export default mdxComponents;