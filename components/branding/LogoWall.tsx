// components/branding/LogoWall.tsx
import clsx from "clsx";
import LogoTile from "./LogoTile";

type Logo = {
  src: string;
  alt: string;
  size?: number;
  decorative?: boolean;
};

type LogoWallProps = {
  logos: Logo[];
  className?: string;
  minSize?: number;
  gapClass?: string;
  ariaLabel?: string;
};

export default function LogoWall({
  logos,
  className,
  minSize = 140,
  gapClass = "gap-8",
  ariaLabel = "Trusted by",
}: LogoWallProps) {
  if (!logos || logos.length === 0) return null;

  return (
    <div
      role="list"
      aria-label={ariaLabel}
      className={clsx("grid justify-items-center", gapClass, className)}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${minSize}px, 1fr))`,
      }}
    >
      {logos.map((logo, idx) => (
        <div role="listitem" key={`${logo.src}-${idx}`}>
          <LogoTile {...logo} />
        </div>
      ))}
    </div>
  );
}