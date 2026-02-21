// components/registry/RegistryView.tsx
import * as React from "react";
import SectorGrid from "./SectorGrid";

interface RegistryViewProps {
  initialDocs: any[];
  categories: string[];
}

export default function RegistryView({ initialDocs, categories }: RegistryViewProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-12 text-center">
        <h1 className="font-serif text-4xl md:text-5xl text-white mb-4">
          Institutional Registry
        </h1>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          Sovereign Archive of Intelligence Briefs and Institutional Assets
        </p>
      </header>
      <SectorGrid />
    </div>
  );
}