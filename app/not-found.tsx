import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#060609] px-6 text-center">
      <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#C9A96E]/70">
        Not Found
      </p>
      <h1
        className="mt-6 text-white/90"
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontSize: "clamp(2rem, 5vw, 3.5rem)",
          fontWeight: 300,
          fontStyle: "italic",
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        This page does not exist.
      </h1>
      <p className="mt-6 max-w-[42ch] text-[15px] leading-[1.8] text-white/50">
        The address may have changed, the resource may have been removed, or the
        path was never published.
      </p>
      <Link
        href="/"
        className="mt-10 inline-flex items-center gap-2 border border-[#C9A96E]/30 bg-[#C9A96E]/[0.06] px-6 py-3 font-mono text-[9px] uppercase tracking-[0.2em] text-[#D7B77E] transition-colors hover:border-[#C9A96E]/50 hover:bg-[#C9A96E]/[0.1]"
      >
        Return to entry
      </Link>
    </div>
  );
}
