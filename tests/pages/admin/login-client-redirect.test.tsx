/** @vitest-environment jsdom */

import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockReplace } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
  useSession: () => ({
    data: { user: { id: "user_1", email: "admin@abrahamoflondon.org" } },
    status: "authenticated",
  }),
}));

vi.mock("next/router", () => ({
  useRouter: () => ({
    asPath: "/admin/login?returnTo=%2Fadmin%2Foutbound%2Flinkedin",
    replace: mockReplace,
  }),
}));

import AdminLoginPage from "@/pages/admin/login";

beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState(
    {},
    "",
    "/admin/login?returnTo=%2Fadmin%2Foutbound%2Flinkedin",
  );
});

describe("AdminLoginPage authenticated redirect", () => {
  it("waits for the deep returnTo and does not replace it with Command Centre", async () => {
    render(<AdminLoginPage googleConfigured={false} />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/admin/outbound/linkedin");
    });
    expect(mockReplace).not.toHaveBeenCalledWith("/admin");
  });
});
