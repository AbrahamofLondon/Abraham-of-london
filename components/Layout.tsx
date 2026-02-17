// components/Layout.tsx
import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");

// Fixed header height: your header is h-20 (= 80px)
const HEADER_HEIGHT_PX = 80;

type LayoutProps = {
  children: React.ReactNode;
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string; // "/" or full URL
  ogType?: string;
  className?: string;
  fullWidth?: boolean;
  headerTransparent?: boolean;
};

function toAbsoluteUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return BASE_URL;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  const clean = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${BASE_URL}${clean}`;
}

// Hard reset any stray blur/gate state
function clearUiLocks() {
  if (typeof document === "undefined") return;

  const html = document.documentElement;
  const body = document.body;
  const main = document.querySelector("main");

  const killClasses = [
    "blur",
    "is-blurred",
    "vault-blur",
    "gated",
    "locked",
    "content-blur",
    "blurred",
    "no-scroll",
    "overflow-hidden",
    "modal-open",
  ];

  killClasses.forEach((c) => {
    html.classList.remove(c);
    body.classList.remove(c);
    main?.classList.remove(c);
  });

  ["data-gated", "data-locked", "data-blur", "aria-hidden"].forEach((attr) => {
    html.removeAttribute(attr);
    body.removeAttribute(attr);
    main?.removeAttribute(attr);
  });

  // Reset common body lock patterns used by drawers/modals
  body.style.position = "";
  body.style.top = "";
  body.style.width = "";
  body.style.overflow = "";
  body.style.overflowY = "";
  body.style.paddingRight = "";

  // Kill inline filter/blur styles if they were set
  body.style.filter = "";
  (body.style as any).backdropFilter = "";

  if (main && (main as HTMLElement).style) {
    (main as HTMLElement).style.filter = "";
    ((main as HTMLElement).style as any).backdropFilter = "";
  }
}

export default function Layout({
  children,
  title = "Abraham of London",
  description = "Institutional strategy, governance discipline, and operator doctrine for serious builders.",
  keywords = "",
  ogImage = "/assets/images/social/og-image.jpg",
  canonicalUrl,
  ogType = "website",
  className = "",
  fullWidth = false,
  headerTransparent = false,
}: LayoutProps) {
  const router = useRouter();
  const asPath = (router.asPath || "/").split("#")[0] || "/";
  const canonicalAbs = toAbsoluteUrl(canonicalUrl ? canonicalUrl : asPath);
  const ogImageAbs = toAbsoluteUrl(ogImage);

  React.useEffect(() => {
    clearUiLocks();
    const onDone = () => clearUiLocks();

    router.events.on("routeChangeComplete", onDone);
    router.events.on("routeChangeError", onDone);

    return () => {
      router.events.off("routeChangeComplete", onDone);
      router.events.off("routeChangeError", onDone);
    };
  }, [router.events]);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        {keywords ? <meta name="keywords" content={keywords} /> : null}
        <link rel="canonical" href={canonicalAbs} />

        <meta property="og:type" content={ogType} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImageAbs} />
        <meta property="og:url" content={canonicalAbs} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImageAbs} />
      </Head>

      <Header transparent={headerTransparent} />

      <main
        style={{ paddingTop: HEADER_HEIGHT_PX }}
        className={[
          "min-h-screen",
          "w-full max-w-full overflow-x-hidden",
          fullWidth ? "" : "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10",
          className,
        ].join(" ")}
      >
        {children}
      </main>

      <Footer />
    </>
  );
}