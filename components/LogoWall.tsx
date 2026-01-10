import LogoTile from "./LogoTile";
import clsx from "clsx";

type Logo = {
  src: string;
  alt: string;
  size?: number; // now honored by LogoTile
  decorative?: boolean; // optional, forwards to LogoTile
};

type LogoWallProps = {
  logos: Logo[];
  className?: string;
  /** Minimum tile width in px for the responsive grid */
  minSize?: number;
  /** Gap class e.g. 'gap-6' (defaults to gap-8) */
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

