import { describe, expect, it, vi } from "vitest";

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
}));

vi.mock("next/dynamic", () => ({
  default: () => () => null,
}));

import {
  getStaticPaths as getVaultStaticPaths,
  getStaticProps as getVaultStaticProps,
} from "@/pages/vault/briefs/[slug]";
import {
  getStaticPaths as getPublicStaticPaths,
  getStaticProps as getPublicStaticProps,
} from "@/pages/briefs/[slug]";

const SCHEDULED_INTELLIGENCE_SLUG =
  "institutional-alpha-false-confidence-from-aggregated-metrics";
const PUBLISHED_INTELLIGENCE_SLUG =
  "institutional-alpha-the-hidden-cost-of-flattering-data";

describe("vault brief route scope", () => {
  it("prebuilds only the 12 vault/canon brief paths without runtime fallback", async () => {
    const response = await getVaultStaticPaths({} as never);
    const paths = "paths" in response ? response.paths : [];
    const slugs = paths.map((entry: any) => entry.params.slug).sort();

    expect(response).toMatchObject({ fallback: false });
    expect(slugs).toHaveLength(12);
    expect(slugs).toContain("brief-001-modern-household");
    expect(slugs).toContain("brief-012-aesthetics-of-order");
  });

  it("does not generate vault paths for content/briefs intelligence slugs", async () => {
    const response = await getVaultStaticPaths({} as never);
    const paths = "paths" in response ? response.paths : [];
    const slugs = paths.map((entry: any) => entry.params.slug);

    expect(slugs).not.toContain(PUBLISHED_INTELLIGENCE_SLUG);
    expect(slugs).not.toContain(SCHEDULED_INTELLIGENCE_SLUG);
    expect(slugs.some((slug: string) => slug.startsWith("institutional-alpha-"))).toBe(false);
    expect(slugs.some((slug: string) => slug.startsWith("sovereign-intelligence-"))).toBe(false);
  });

  it("renders all 12 canon/vault briefs through /vault/briefs/[slug]", async () => {
    const response = await getVaultStaticPaths({} as never);
    const paths = "paths" in response ? response.paths : [];

    for (const entry of paths as Array<{ params: { slug: string } }>) {
      const props = await getVaultStaticProps({
        params: { slug: entry.params.slug },
      } as never);

      expect(props).not.toMatchObject({ notFound: true });
      expect(props).toMatchObject({
        props: {
          bareSlug: entry.params.slug,
          brief: { slug: entry.params.slug },
        },
      });
    }
  });

  it("returns notFound for intelligence briefs through the vault route", async () => {
    await expect(
      getVaultStaticProps({
        params: { slug: PUBLISHED_INTELLIGENCE_SLUG },
      } as never),
    ).resolves.toMatchObject({ notFound: true });

    await expect(
      getVaultStaticProps({
        params: { slug: SCHEDULED_INTELLIGENCE_SLUG },
      } as never),
    ).resolves.toMatchObject({ notFound: true });
  });

  it("/briefs generates only the 8 published launch intelligence briefs", async () => {
    const response = await getPublicStaticPaths({} as never);
    const paths = "paths" in response ? response.paths : [];
    const slugs = paths.map((entry: any) => entry.params.slug);

    expect(response).toMatchObject({ fallback: false });
    expect(slugs).toHaveLength(8);
    expect(slugs).toContain(PUBLISHED_INTELLIGENCE_SLUG);
    expect(slugs).not.toContain(SCHEDULED_INTELLIGENCE_SLUG);
  });

  it("scheduled intelligence brief direct routes remain notFound", async () => {
    await expect(
      getPublicStaticProps({
        params: { slug: SCHEDULED_INTELLIGENCE_SLUG },
      } as never),
    ).resolves.toMatchObject({ notFound: true });
  });
});
