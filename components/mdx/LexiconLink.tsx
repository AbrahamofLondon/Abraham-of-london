import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function LexiconLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-amber-500 underline underline-offset-4 decoration-amber-500/30 hover:decoration-amber-500 transition-all inline-flex items-center gap-1"
    >
      {children}
      <ArrowUpRight className="h-3 w-3 opacity-60" />
    </Link>
  );
}