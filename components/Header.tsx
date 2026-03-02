/* components/Header.tsx — COMPLETE FIXED VERSION */
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Menu, X, ChevronDown } from "lucide-react";

// Define the NavItem type
type NavItem = {
  route: string;
  label: string;
  description?: string;
  highlight?: boolean;
};

type RouteId =
  | "home"
  | "canon"
  | "books"
  | "library"
  | "essays"
  | "shorts"
  | "ventures"
  | "about"
  | "contact"
  | "vault"
  | "briefs";

const ROUTES: Record<RouteId, string> = {
  home: "/",
  canon: "/canon",
  books: "/books",
  library: "/library",
  essays: "/blog",
  shorts: "/shorts",
  ventures: "/ventures",
  about: "/about",
  contact: "/contact",
  vault: "/vault",
  briefs: "/vault/briefs",
};

const NAV_ITEMS: NavItem[] = [
  { route: "canon", label: "Canon", description: "Doctrine & method" },
  { route: "books", label: "Books", description: "Volumes & works" },
  { route: "essays", label: "Essays", description: "Literary intelligence" },
  { route: "library", label: "Library", description: "Archive & research" },
  { route: "briefs", label: "Briefs", description: "Vault intelligence" },
  { route: "ventures", label: "Ventures", description: "Execution arms" },
  { route: "shorts", label: "Shorts", description: "Short-form signal", highlight: true },
  { route: "about", label: "About", description: "The platform" },
  { route: "vault", label: "Vault", description: "Tools & downloads" },
];

interface HeaderProps {
  transparent?: boolean;
}

const Header: React.FC<HeaderProps> = ({ transparent = false }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  React.useEffect(() => {
    setIsOpen(false);
  }, [router.asPath]);

  const headerClass = `fixed top-0 w-full z-50 transition-all duration-300 ${
    transparent && !scrolled && !isOpen
      ? "bg-transparent"
      : "bg-black/90 backdrop-blur-sm border-b border-white/10"
  }`;

  return (
    <header className={headerClass}>
      <nav className="mx-auto max-w-7xl px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-amber-500 font-mono text-xs tracking-widest">
          ABRAHAM OF LONDON
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.route}
              href={ROUTES[item.route as RouteId]}
              className={`text-sm transition-colors ${
                router.pathname === ROUTES[item.route as RouteId]
                  ? "text-amber-500"
                  : "text-zinc-400 hover:text-white"
              } ${item.highlight ? "text-amber-500 font-medium" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-zinc-400 hover:text-white transition-colors"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-sm border-t border-white/10 py-4">
          <div className="mx-auto max-w-7xl px-6 space-y-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.route}
                href={ROUTES[item.route as RouteId]}
                className="block py-2 text-zinc-400 hover:text-white transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
                {item.description && (
                  <span className="block text-xs text-zinc-600">{item.description}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;