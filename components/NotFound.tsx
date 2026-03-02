/* components/NotFound.tsx */
export function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050505] to-black flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="font-serif text-4xl text-white/90 mb-4">Briefing Not Found</h1>
        <p className="text-white/50 max-w-md">
          The requested intelligence brief could not be located in the archive.
        </p>
      </div>
    </div>
  );
}