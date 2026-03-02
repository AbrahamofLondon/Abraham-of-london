/* app/briefs/[slug]/not-found.tsx */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-xl">
        <p className="font-mono text-xs tracking-[0.3em] text-zinc-500 mb-4">
          ABRAHAM OF LONDON // BRIEFING ARCHIVE
        </p>
        <h1 className="font-serif text-4xl mb-3">Briefing Not Found</h1>
        <p className="text-zinc-400">
          The requested intelligence brief does not exist or has been withdrawn.
        </p>
      </div>
    </div>
  );
}