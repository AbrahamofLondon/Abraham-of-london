/* components/mdx-components.tsx */
import * as React from "react";
import * as Lucide from "lucide-react";

// Layout & Foundation
import Divider from "./Divider";
import Rule from "./Rule";
import Grid from "./Grid"; 
import PullLine from "./mdx/PullLine";

// High-Prose (Semantic)
import Callout from "./Callout";
import Quote from "./Quote";
// Corrected to named import based on your Note component code 📝
import { Note } from "./Note"; 
import Caption from "./mdx/Caption"; 

// Strategic Logic
import CanonReference from "./CanonReference";
import GlossaryTerm from "./GlossaryTerm";

// Branding & Print 
import EmbossedBrandMark from "./EmbossedBrandMark"; 
import EmbossedSign from "./print/EmbossedSign";

const baseComponents: Record<string, any> = {
  h1: (props: any) => <h1 className="mt-16 mb-8 font-serif text-4xl font-semibold text-white" {...props} />,
  p: (props: any) => <p className="my-6 text-lg leading-relaxed text-gray-300" {...props} />,
  Divider, 
  Rule,
  Grid,
  Callout,
  PullLine,
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
    if (typeof prop !== 'string') return undefined;
    const foundKey = Object.keys(target).find((k) => k.toLowerCase() === prop.toLowerCase());
    return foundKey ? target[foundKey] : ({ children }: any) => <>{children}</>;
  },
});

export default mdxComponents;