// components/Layout.tsx
import Head from "next/head";
import Link from "next/link";
import SocialFollowStrip from "@/components/SocialFollowStrip";

type LayoutProps = {
  children: React.ReactNode;
  pageTitle?: string;
};

export default function Layout({ children, pageTitle }: LayoutProps) {
  const title = pageTitle ? `${pageTitle} | Abraham of London` : "Abraham of London";

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Social strip site-wide */}
      <SocialFollowStrip />

      <main className="min-h-screen bg-gray-50">{children}</main>

      {/* Minimal Footer (with Privacy & Terms links) */}
      <footer className="border-t border-gray-200 bg-gray-50 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center md:flex-row md:text-left">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} Abraham of London. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-600">
            <Link
              href="/privacy"
              className="hover:text-gray-900 underline decoration-forest/40 hover:decoration-forest"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-gray-900 underline decoration-forest/40 hover:decoration-forest"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
