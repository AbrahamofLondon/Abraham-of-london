// components/mdx/component-resolver.tsx
import * as React from "react";
import { MissingComponent } from "./MissingComponent";

type AnyComponent = React.ComponentType<any>;

// -----------------------------
// ✅ CORE REGISTRY (SSR-safe)
// -----------------------------
// These are the components your MDX should be allowed to use safely on SSR.
// Pull from the *actual* locations in your repo, based on your directory listings.

import Badge from "@/components/mdx/Badge";
import BadgeRow from "@/components/mdx/BadgeRow";
import BrandFrame from "@/components/mdx/BrandFrame";
import BriefAlert from "@/components/mdx/BriefAlert";
import BriefSummaryCard from "@/components/mdx/BriefSummaryCard";
import Callout from "@/components/mdx/Callout";
import Caption from "@/components/mdx/Caption";
import CTA from "@/components/mdx/CTA";
import CTAPreset from "@/components/mdx/CTAPreset";
import CtaPresetComponent from "@/components/mdx/CtaPresetComponent";
import Divider from "@/components/mdx/Divider";
import DocumentFooter from "@/components/mdx/DocumentFooter";
import DocumentHeader from "@/components/mdx/DocumentHeader";
import DownloadCard from "@/components/mdx/DownloadCard";
import EmbossedBrandMark from "@/components/mdx/EmbossedBrandMark";
import Grid from "@/components/mdx/Grid";
import HeroEyebrow from "@/components/mdx/HeroEyebrow";
import JsonLd from "@/components/mdx/JsonLd";
import LexiconLink from "@/components/mdx/LexiconLink";
import Note from "@/components/mdx/Note";
import ProcessSteps from "@/components/mdx/ProcessSteps";
import PullLine from "@/components/mdx/PullLine";
import Quote from "@/components/mdx/Quote";
import ResourcesCTA from "@/components/mdx/ResourcesCTA";
import Responsibility from "@/components/mdx/Responsibility";
import ResponsibilityGrid from "@/components/mdx/ResponsibilityGrid";
import Rule from "@/components/mdx/Rule";
import ShareRow from "@/components/mdx/ShareRow";
import Step from "@/components/mdx/Step";
import Verse from "@/components/mdx/Verse";

// Legacy/content components (you have them under /components/content)
import FeatureGrid from "@/components/content/FeatureGrid";
import ProTip from "@/components/content/ProTip";
// If you actively use DownloadCTA tag in MDX, expose it too.
// (You have both .client.jsx and .jsx; pick the stable one you actually want.)
import DownloadCTA from "@/components/content/DownloadCTA";

// Root-level components you likely reference in MDX
import CanonReference from "@/components/CanonReference";
import GlossaryTerm from "@/components/GlossaryTerm";

// OPTIONAL: if your MDX uses <BrandFrame> from root as well, ensure no collision.
// You have both /components/mdx/BrandFrame.tsx and /components/BrandFrame.tsx.
// We choose the mdx one above, because that’s where you listed the MDX file.
// If you truly need the root BrandFrame too, alias it:
// import RootBrandFrame from "@/components/BrandFrame";

// -----------------------------
// ✅ Registry
// -----------------------------
const REGISTRY: Record<string, AnyComponent> = {
  // mdx/
  Badge,
  BadgeRow,
  BrandFrame,
  BriefAlert,
  BriefSummaryCard,
  Callout,
  Caption,
  CTA,
  CTAPreset,
  CtaPresetComponent,
  Divider,
  DocumentFooter,
  DocumentHeader,
  DownloadCard,
  EmbossedBrandMark,
  Grid,
  HeroEyebrow,
  JsonLd,
  LexiconLink,
  Note,
  ProcessSteps,
  PullLine,
  Quote,
  ResourcesCTA,
  Responsibility,
  ResponsibilityGrid,
  Rule,
  ShareRow,
  Step,
  Verse,

  // content/
  FeatureGrid,
  ProTip,
  DownloadCTA,

  // root components
  CanonReference,
  GlossaryTerm,
};

// Cache for dynamic components (rare use)
const componentCache = new Map<string, AnyComponent>();

// -----------------------------
// ✅ Synchronous resolver (SSR-safe)
// -----------------------------
export function resolveComponentSync(componentName: string): AnyComponent {
  const registered = REGISTRY[componentName];
  if (registered) return registered;

  const cached = componentCache.get(componentName);
  if (cached) return cached;

  const Fallback: React.FC<any> = (props) => (
    <MissingComponent componentName={componentName} {...props} />
  );
  Fallback.displayName = `Missing(${componentName})`;

  componentCache.set(componentName, Fallback);
  return Fallback;
}

// -----------------------------
// ⚠️ Dynamic resolver (client-only components only)
// -----------------------------
// Only use for components that truly cannot SSR.
// This supports BOTH "@/components/mdx/*" and "@/components/content/*".
export function createDynamicComponent(
  componentName: string,
  options?: { roots?: Array<"mdx" | "content" | "root"> }
): React.FC<any> {
  const roots = options?.roots ?? ["mdx", "content", "root"];

  const DynamicComponent: React.FC<any> = React.memo((props) => {
    const [Component, setComponent] = React.useState<AnyComponent>(() => {
      // If it's in registry, use it immediately (no hydration games).
      const registered = REGISTRY[componentName];
      if (registered) return registered;

      const cached = componentCache.get(componentName);
      if (cached) return cached;

      // Use fallback during first render (SSR-safe).
      const Fallback: React.FC<any> = (p) => (
        <MissingComponent componentName={componentName} {...p} />
      );
      Fallback.displayName = `Missing(${componentName})`;
      return Fallback;
    });

    React.useEffect(() => {
      let mounted = true;

      // If already resolved, do nothing.
      if (REGISTRY[componentName] || componentCache.has(componentName)) return;

      const tryLoad = async (): Promise<AnyComponent | null> => {
        // Attempt imports in declared root order.
        for (const root of roots) {
          try {
            let imported: any;

            if (root === "mdx") {
              imported = await import(`@/components/mdx/${componentName}`);
            } else if (root === "content") {
              imported = await import(`@/components/content/${componentName}`);
            } else {
              imported = await import(`@/components/${componentName}`);
            }

            const C: AnyComponent =
              (typeof imported?.default === "function" && imported.default) ||
              (typeof imported?.[componentName] === "function" &&
                imported[componentName]);

            if (typeof C === "function") return C;
          } catch {
            // swallow and continue
          }
        }
        return null;
      };

      (async () => {
        try {
          const C = await tryLoad();
          if (!C) throw new Error(`No valid export found for ${componentName}`);

          componentCache.set(componentName, C);
          if (mounted) setComponent(() => C);
        } catch (e) {
          console.error(`[MDX] Dynamic load failed for ${componentName}`, e);
          const Fallback: React.FC<any> = (p) => (
            <MissingComponent componentName={componentName} {...p} />
          );
          Fallback.displayName = `Missing(${componentName})`;
          componentCache.set(componentName, Fallback);
          if (mounted) setComponent(() => Fallback);
        }
      })();

      return () => {
        mounted = false;
      };
    }, [componentName, roots.join("|")]);

    return <Component {...props} />;
  });

  DynamicComponent.displayName = `Dynamic(${componentName})`;
  return DynamicComponent;
}

// -----------------------------
// Backward-compat exports
// -----------------------------
// If other parts of your code still call getComponent/getComponentSync,
// keep these wrappers so you don't have to refactor everything at once.

export async function getComponent(componentName: string): Promise<AnyComponent> {
  // Prefer SSR-safe sync resolution always.
  const C = REGISTRY[componentName] ?? componentCache.get(componentName);
  if (C) return C;

  // As a fallback, attempt dynamic load (mdx → content → root).
  // This keeps your old API but without SSR-null behaviour.
  let imported: any = null;

  const tryRoots = ["mdx", "content", "root"] as const;
  for (const root of tryRoots) {
    try {
      if (root === "mdx") imported = await import(`@/components/mdx/${componentName}`);
      if (root === "content") imported = await import(`@/components/content/${componentName}`);
      if (root === "root") imported = await import(`@/components/${componentName}`);

      const Resolved: AnyComponent =
        (typeof imported?.default === "function" && imported.default) ||
        (typeof imported?.[componentName] === "function" && imported[componentName]);

      if (typeof Resolved === "function") {
        componentCache.set(componentName, Resolved);
        return Resolved;
      }
    } catch {
      // continue
    }
  }

  const Fallback: React.FC<any> = (props) => (
    <MissingComponent componentName={componentName} {...props} />
  );
  Fallback.displayName = `Missing(${componentName})`;
  componentCache.set(componentName, Fallback);
  return Fallback;
}

export function getComponentSync(componentName: string): AnyComponent | null {
  return REGISTRY[componentName] ?? componentCache.get(componentName) ?? null;
}