/**
 * lib/content/content-provenance.ts
 *
 * Content provenance and authority metadata for Briefs, Vault, and Editorial surfaces.
 *
 * Each piece of content can declare:
 *   - content family (brief / vault / editorial)
 *   - source file path
 *   - publication status (published / scheduled / draft / hidden)
 *   - publication date
 *   - last verified date
 *   - decision this informs
 *   - next admissible move
 *   - challenge/red-team route
 *
 * This is metadata attached to content, not a DB model.
 * Content remains contentlayer/frontmatter-derived.
 * Provenance is declared in frontmatter or computed at build time.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ContentFamily = "brief" | "vault" | "editorial";

export type PublicationStatus = "published" | "scheduled" | "draft" | "hidden";

export interface ContentProvenance {
  /** Content family */
  family: ContentFamily;
  /** Source file path relative to content/ */
  sourceFile: string;
  /** Publication status */
  publicationStatus: PublicationStatus;
  /** When this content was first published */
  publicationDate: string | null;
  /** When this content was last verified for accuracy */
  lastVerifiedDate: string | null;
  /** What decision this content informs (optional) */
  informsDecision?: string;
  /** What the reader should do next after reading */
  nextAdmissibleMove?: string;
  /** Route for challenging claims or submitting counter-evidence */
  challengeRoute?: string;
  /** OG/cover image path */
  coverImage?: string;
  /** Whether this content has a themed cover (not homepage fallback) */
  hasThemedCover: boolean;
}

// ─── Default provenance for content types ─────────────────────────────────────

export function getDefaultProvenance(family: ContentFamily): Partial<ContentProvenance> {
  const defaults: Record<ContentFamily, Partial<ContentProvenance>> = {
    brief: {
      family: "brief",
      challengeRoute: "/admin/intelligence-foundry/red-team/content",
      nextAdmissibleMove: "Apply this doctrine to a live decision using the Pressure Signal or Boardroom Brief.",
    },
    vault: {
      family: "vault",
      challengeRoute: "/admin/intelligence-foundry/red-team/content",
      nextAdmissibleMove: "Test whether this doctrine holds under your specific conditions using the Strategy Room.",
    },
    editorial: {
      family: "editorial",
      nextAdmissibleMove: "Explore related doctrine in the Vault or apply the framework to a live decision.",
    },
  };
  return defaults[family] ?? {};
}

// ─── Decision-loop CTA builder ────────────────────────────────────────────────

export interface DecisionLoopCTA {
  question: string;
  primaryAction: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
}

/**
 * Build a "What decision does this inform?" CTA for a brief or vault entry.
 */
export function buildDecisionLoopCTA(
  provenance: ContentProvenance,
  title: string,
): DecisionLoopCTA | null {
  if (provenance.family === "editorial") {
    return {
      question: "How does this editorial apply to your current situation?",
      primaryAction: {
        label: "Test a decision",
        href: "/pressure",
      },
      secondaryAction: {
        label: "Explore related doctrine",
        href: "/vault/briefs",
      },
    };
  }

  if (provenance.family === "brief" || provenance.family === "vault") {
    return {
      question: `What decision does "${title}" inform?`,
      primaryAction: {
        label: "Apply to a live decision",
        href: "/pressure",
      },
      secondaryAction: provenance.challengeRoute
        ? {
            label: "Challenge this claim",
            href: provenance.challengeRoute,
          }
        : undefined,
    };
  }

  return null;
}

// ─── Cover image resolution ──────────────────────────────────────────────────

/**
 * Check if a cover image path resolves to a themed cover (not homepage fallback).
 * Themed covers are in /assets/images/covers/ or /assets/images/og/.
 * Homepage fallback is /assets/images/social/og-image.jpg.
 */
export function hasThemedCover(coverImage: string | null | undefined): boolean {
  if (!coverImage) return false;
  const homepageFallback = "/assets/images/social/og-image.jpg";
  if (coverImage === homepageFallback) return false;
  // Themed covers have specific paths
  return (
    coverImage.startsWith("/assets/images/covers/") ||
    coverImage.startsWith("/assets/images/og/") ||
    coverImage.startsWith("/assets/images/briefs/") ||
    coverImage.startsWith("/images/")
  );
}
