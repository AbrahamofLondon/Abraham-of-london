import fs from "fs";
import path from "path";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
}));

vi.mock("next/dynamic", () => ({
  default: () => () => null,
}));

vi.mock("@/components/Layout", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

import {
  getStaticPaths as getVaultStaticPaths,
  getStaticProps as getVaultStaticProps,
} from "@/pages/vault/briefs/[slug]";
import VaultBriefsIndexPage, {
  getStaticProps as getVaultIndexStaticProps,
} from "@/pages/vault/briefs/index";
import {
  getStaticPaths as getPublicStaticPaths,
  getStaticProps as getPublicStaticProps,
} from "@/pages/briefs/[slug]";
import {
  getPublicBriefHref,
  getVaultBriefHref,
} from "@/lib/content/brief-routes";

const SCHEDULED_INTELLIGENCE_SLUG =
  "institutional-alpha-false-confidence-from-aggregated-metrics";
const PUBLISHED_INTELLIGENCE_SLUG =
  "institutional-alpha-the-hidden-cost-of-flattering-data";
const FRONTIER_RESILIENCE_SLUG =
  "frontier-resilience-stress-reveals-the-real-culture";
const FRONTIER_RESILIENCE_CANONICAL_ALIAS_TARGET =
  "frontier-resilience-surviving-volatility-without-losing-governing-order";
const CANON_VAULT_SLUG = "brief-001-modern-household";

const ROOT = path.resolve(__dirname, "../../..");
const BRIEFS_CONTENT = path.join(ROOT, "content", "briefs");
const VAULT_BRIEFS_CONTENT = path.join(ROOT, "content", "vault", "briefs");

function mdxBareSlugs(dir: string): string[] {
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/i, ""))
    .sort();
}

function intelligenceBriefSlugs(): string[] {
  return mdxBareSlugs(BRIEFS_CONTENT).filter(
    (slug) =>
      slug.startsWith("institutional-alpha-") ||
      slug.startsWith("sovereign-intelligence-"),
  );
}

function pathSlugs(paths: unknown): string[] {
  return (Array.isArray(paths) ? paths : [])
    .map((entry: any) =>
      typeof entry === "string" ? entry.split("/").filter(Boolean).pop() : entry?.params?.slug,
    )
    .filter(Boolean)
    .sort();
}

const CANON_VAULT_SLUGS = Array.from({ length: 12 }, (_, index) =>
  `brief-${String(index + 1).padStart(3, "0")}`,
);

describe("vault brief route scope", () => {
  it("uses fallback blocking to allow on-demand generation", async () => {
    const response = await getVaultStaticPaths({} as never);
    expect(response).toMatchObject({ fallback: "blocking" });
  });

  it("prebuilds every physical vault brief path", async () => {
    const response = await getVaultStaticPaths({} as never);
    const slugs = pathSlugs("paths" in response ? response.paths : []);
    const vaultFileSlugs = mdxBareSlugs(VAULT_BRIEFS_CONTENT);

    expect(slugs).toHaveLength(vaultFileSlugs.length);
    expect(slugs).toEqual(vaultFileSlugs);
    expect(slugs).toContain("brief-001-modern-household");
    expect(slugs).toContain("brief-012-aesthetics-of-order");
    expect(slugs).toContain(FRONTIER_RESILIENCE_SLUG);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("valid Frontier Resilience vault slug renders through /vault/briefs", async () => {
    await expect(
      getVaultStaticProps({
        params: { slug: FRONTIER_RESILIENCE_SLUG },
      } as never),
    ).resolves.toMatchObject({
      props: {
        bareSlug: FRONTIER_RESILIENCE_SLUG,
        brief: { slug: FRONTIER_RESILIENCE_SLUG },
      },
    });
  });

  it("legacy Frontier Resilience numeric slug redirects to canonical vault slug", async () => {
    await expect(
      getVaultStaticProps({
        params: { slug: "frontier-resilience-01" },
      } as never),
    ).resolves.toMatchObject({
      redirect: {
        destination: `/vault/briefs/${FRONTIER_RESILIENCE_CANONICAL_ALIAS_TARGET}`,
        permanent: true,
      },
    });
  });

  it("canonical Frontier Resilience alias target renders through /vault/briefs", async () => {
    await expect(
      getVaultStaticProps({
        params: { slug: FRONTIER_RESILIENCE_CANONICAL_ALIAS_TARGET },
      } as never),
    ).resolves.toMatchObject({
      props: {
        bareSlug: FRONTIER_RESILIENCE_CANONICAL_ALIAS_TARGET,
        brief: {
          slug: FRONTIER_RESILIENCE_CANONICAL_ALIAS_TARGET,
          coverImage: "/assets/images/covers/briefs/frontier-resilience-cover.webp",
        },
      },
    });
  });

  it("valid Canon vault slug renders through /vault/briefs", async () => {
    await expect(
      getVaultStaticProps({
        params: { slug: CANON_VAULT_SLUG },
      } as never),
    ).resolves.toMatchObject({
      props: {
        bareSlug: CANON_VAULT_SLUG,
        brief: {
          slug: CANON_VAULT_SLUG,
          coverImage: "/assets/images/covers/briefs/vault-briefs-cover.webp",
        },
      },
    });
  });

  it("published Intelligence Brief does not render through /vault/briefs", async () => {
    await expect(
      getVaultStaticProps({
        params: { slug: PUBLISHED_INTELLIGENCE_SLUG },
      } as never),
    ).resolves.toMatchObject({ notFound: true });
  });

  it("scheduled Intelligence Brief does not render through /vault/briefs", async () => {
    await expect(
      getVaultStaticProps({
        params: { slug: SCHEDULED_INTELLIGENCE_SLUG },
      } as never),
    ).resolves.toMatchObject({ notFound: true });
  });

  it("missing slug returns notFound (fail-closed)", async () => {
    await expect(
      getVaultStaticProps({
        params: { slug: "nonexistent-brief-slug" },
      } as never),
    ).resolves.toMatchObject({ notFound: true });
  });

  it("/vault/briefs index separates canon and Frontier Resilience groups", async () => {
    const response = await getVaultIndexStaticProps({} as never);
    const props = "props" in response ? (response.props as any) : null;
    const items = props?.items || [];
    const canon = items.filter((item: any) => item.group === "canon");
    const frontier = items.filter((item: any) => item.group === "frontier-resilience");
    const html = renderToStaticMarkup(<VaultBriefsIndexPage {...props} />);

    expect(props).toMatchObject({ total: 38 });
    expect(canon).toHaveLength(12);
    expect(frontier).toHaveLength(26);
    expect(html).toContain("Foundational Canon");
    expect(html).toContain("Frontier Resilience Sequence");
    expect(html).toContain("Vault Briefs are not the same as Intelligence Briefs");
    expect(html).toContain("Vault Dependency Map");
    expect(html).toContain("Recommended Reading Paths");
    expect(html).toContain("Household Order");
    expect(html).toContain("Founder/Operator Resilience");
    expect(html).toContain("Governance Under Pressure");
    expect(html).toContain("Crisis and Recovery");
    expect(html).toContain("Legacy and Inner Circle");
    expect(html).toContain("Rise-Decay Scorecard");
    expect(html).toContain("Decision Rights Charter");
    expect(html).toContain("Frontier Resilience Stress Test");
    expect(html).toContain("Key-Person Risk Scorecard");
    expect(html).toContain("Signal Discipline Standards");
    expect(html).toContain("Cadence Health Checklist");
    expect(html).toContain("Crisis Loop Interruption Protocol");
    expect(html).toContain("Legacy Ledger Template");
    expect(html).toContain("Inner Circle Council Charter");
    expect(html).toContain("Covenantal Oath Template");
    expect(html).toContain("Instruments remain inside application");
    expect(html).toContain(
      "The public Vault defines standards and exposes failure patterns. Inner Circle companions provide the instruments for diagnosis, sequencing, and repair.",
    );
    expect(html).toContain("frontier-resilience");
  });

  it("every /vault/briefs index item links to a detail route, not the index", async () => {
    const response = await getVaultIndexStaticProps({} as never);
    const props = "props" in response ? (response.props as any) : null;

    for (const item of props?.items || []) {
      expect(item.href).toMatch(/^\/vault\/briefs\/[^/]+$/);
      expect(item.href).not.toBe("/vault/briefs");
    }
  });

  it("brief route helpers never use index routes as item fallback", () => {
    expect(getVaultBriefHref("frontier-resilience-01")).toBe(
      `/vault/briefs/${FRONTIER_RESILIENCE_CANONICAL_ALIAS_TARGET}`,
    );
    expect(getVaultBriefHref("")).toBeNull();
    expect(getPublicBriefHref("")).toBeNull();
    expect(getPublicBriefHref(PUBLISHED_INTELLIGENCE_SLUG)).toBe(`/briefs/${PUBLISHED_INTELLIGENCE_SLUG}`);
  });

  it("proxy leaves /vault/briefs public so document-level gates can decide access", () => {
    const proxySource = fs.readFileSync(path.join(ROOT, "proxy.ts"), "utf-8");

    expect(proxySource).toContain("\"/vault/briefs\"");
    expect(proxySource).toContain("\"/vault\"");
    expect(proxySource).toContain("vaultBriefAliasRedirect");
  });

  it("does not generate vault paths for content/briefs intelligence slugs", async () => {
    const response = await getVaultStaticPaths({} as never);
    const slugs = pathSlugs("paths" in response ? response.paths : []);
    const leaked = intelligenceBriefSlugs().filter((slug) => slugs.includes(slug));

    expect(leaked).toEqual([]);
    expect(slugs).not.toContain(PUBLISHED_INTELLIGENCE_SLUG);
    expect(slugs).not.toContain(SCHEDULED_INTELLIGENCE_SLUG);
    expect(slugs.some((slug: string) => slug.startsWith("institutional-alpha-"))).toBe(false);
    expect(slugs.some((slug: string) => slug.startsWith("sovereign-intelligence-"))).toBe(false);
  });

  it("generates clean bare slugs for every vault brief path", async () => {
    const response = await getVaultStaticPaths({} as never);
    const slugs = pathSlugs("paths" in response ? response.paths : []);

    for (const slug of slugs) {
      expect(slug).not.toContain("/");
      expect(slug).not.toMatch(/\.mdx$/);
    }
  });

  it("keeps the 12 canon/pillar vault briefs renderable", async () => {
    const response = await getVaultStaticPaths({} as never);
    const slugs = pathSlugs("paths" in response ? response.paths : []);
    const canonSlugs = slugs.filter((slug) =>
      CANON_VAULT_SLUGS.some((prefix) => slug.startsWith(prefix)),
    );

    expect(canonSlugs).toHaveLength(12);

    for (const slug of canonSlugs) {
      await expect(
        getVaultStaticProps({
          params: { slug },
        } as never),
      ).resolves.not.toMatchObject({ notFound: true });
    }
  });

  it("/briefs uses fallback blocking and generates only the 8 published launch intelligence briefs", async () => {
    const response = await getPublicStaticPaths({} as never);
    const paths = "paths" in response ? response.paths : [];
    const slugs = paths.map((entry: any) => entry.params.slug);

    expect(response).toMatchObject({ fallback: "blocking" });
    expect(slugs).toHaveLength(8);
    expect(slugs).toContain(PUBLISHED_INTELLIGENCE_SLUG);
    expect(slugs).not.toContain(FRONTIER_RESILIENCE_SLUG);
    expect(slugs).not.toContain(SCHEDULED_INTELLIGENCE_SLUG);
  });

  it("scheduled Intelligence Brief does not render through /briefs", async () => {
    await expect(
      getPublicStaticProps({
        params: { slug: SCHEDULED_INTELLIGENCE_SLUG },
      } as never),
    ).resolves.toMatchObject({ notFound: true });
  });

  it("editorial-hold brief does not render through /briefs", async () => {
    // There are no editorial-hold briefs currently, but the gate should block them
    // Test with a slug that would be blocked by isPublishedBrief
    await expect(
      getPublicStaticProps({
        params: { slug: "sovereign-intelligence-control-without-ownership" },
      } as never),
    ).resolves.toMatchObject({ notFound: true });
  });

  it("published launch Intelligence Brief renders through /briefs", async () => {
    const response = await getPublicStaticProps(
      {
        params: { slug: PUBLISHED_INTELLIGENCE_SLUG },
      } as never,
    );

    expect(response).not.toMatchObject({ notFound: true });
    expect(response).toMatchObject({
      props: {
        bareSlug: PUBLISHED_INTELLIGENCE_SLUG,
      },
    });
  });

  it("published Institutional Alpha detail uses the Institutional Alpha cover", async () => {
    const response = await getPublicStaticProps(
      {
        params: { slug: PUBLISHED_INTELLIGENCE_SLUG },
      } as never,
    );
    const pageSource = fs.readFileSync(path.join(ROOT, "pages", "briefs", "[slug].tsx"), "utf-8");

    expect(response).not.toMatchObject({ notFound: true });
    expect(pageSource).toContain("absoluteBriefCoverForPublicSlug");
    expect(pageSource).toContain("briefCoverAltForPublicSlug");
    expect(pageSource).not.toContain("/assets/images/social/og-image.jpg");
  });

  it("scheduled Intelligence Brief via /vault/briefs remains notFound even with blocking fallback", async () => {
    await expect(
      getVaultStaticProps({
        params: { slug: SCHEDULED_INTELLIGENCE_SLUG },
      } as never),
    ).resolves.toMatchObject({ notFound: true });
  });

  it("Frontier Resilience does not render through /briefs", async () => {
    await expect(
      getPublicStaticProps({
        params: { slug: FRONTIER_RESILIENCE_SLUG },
      } as never),
    ).resolves.toMatchObject({ notFound: true });
  });

  it("missing slug returns notFound through /briefs (fail-closed)", async () => {
    await expect(
      getPublicStaticProps({
        params: { slug: "nonexistent-brief-slug" },
      } as never),
    ).resolves.toMatchObject({ notFound: true });
  });
});
