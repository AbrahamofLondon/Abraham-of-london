import { describe, expect, it } from "vitest";

import { getServerSideProps } from "@/pages/auth/error";

describe("/auth/error", () => {
  it("sanitizes raw Prisma errors from query params", async () => {
    const result = await getServerSideProps({
      query: {
        error: "Invalid prisma.user.upsert invocation Can't reach database server at ep-solitary-mud-ab6t4raj-pooler.eu-west-2.aws.neon.tech:5432",
      },
    } as any);

    expect("props" in result).toBe(true);
    const props = "props" in result ? result.props as any : {};
    expect(props.code).toBe("AUTH_SIGNIN_FAILED");
    expect(props.message).toBe("Authentication is temporarily unavailable. Please try again later or contact support.");
    expect(JSON.stringify(props)).not.toContain("neon.tech");
    expect(JSON.stringify(props)).not.toContain("prisma.user.upsert");
  });

  it("preserves known safe auth database codes", async () => {
    const result = await getServerSideProps({
      query: { error: "AUTH_DATABASE_UNAVAILABLE" },
    } as any);

    const props = "props" in result ? result.props as any : {};
    expect(props.code).toBe("AUTH_DATABASE_UNAVAILABLE");
  });
});
