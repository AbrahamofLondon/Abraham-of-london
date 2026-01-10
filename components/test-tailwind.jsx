// components/test-tailwind.jsx
// This forces Tailwind to generate all color utilities
export const ForceColors = () => (
  <div className="hidden">
    {/* Force text colors */}
    <span className="text-foreground" />
    <span className="text-primary" />
    <span className="text-background" />
    <span className="text-secondary" />
    
    {/* Force background colors */}
    <span className="bg-foreground" />
    <span className="bg-primary" />
    <span className="bg-background" />
    <span className="bg-secondary" />
    
    {/* Force selection variants */}
    <span className="selection:bg-primary/30" />
  </div>
);
