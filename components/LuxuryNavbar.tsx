import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

type Props = {
  transparent?: boolean;
};

export default function LuxuryNavbar({ transparent = false }: Props) {
  const router = useRouter();
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const baseBg =
    transparent && !scrolled
      ? "bg-black/20"
      : "bg-black/70";

  return (
    <header className="fixed left-0 right-0 top-0 z-50">
      {/* IMPORTANT: background layer must NOT eat clicks */}
      <div className={`h-20 border-b border-white/10 ${baseBg} backdrop-blur-md pointer-events-none`} />

      {/* Actual clickable nav sits above background */}
      <div className="absolute inset-0 pointer-events-auto">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="font-serif text-lg text-amber-100">
            Abraham of London
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <NavLink href="/consulting" active={router.asPath.startsWith("/consulting")}>Consulting</NavLink>
            <NavLink href="/canon" active={router.asPath.startsWith("/canon")}>Canon</NavLink>
            <NavLink href="/strategy" active={router.asPath.startsWith("/strategy")}>Strategy</NavLink>
            <NavLink href="/ventures" active={router.asPath.startsWith("/ventures")}>Ventures</NavLink>
            <NavLink href="/books" active={router.asPath.startsWith("/books")}>Books</NavLink>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/consulting#book"
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-black"
            >
              Book a session
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "text-sm font-semibold tracking-wide transition-colors",
        active ? "text-amber-200" : "text-gray-200 hover:text-amber-200",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}