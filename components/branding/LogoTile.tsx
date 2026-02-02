// components/branding/LogoTile.tsx
import clsx from "clsx";

type LogoTileProps = {
  src: string;
  alt: string;
  size?: number;          // height in px (width auto)
  decorative?: boolean;
  className?: string;
};

export default function LogoTile({
  src,
  alt,
  size = 40,
  decorative = false,
  className,
}: LogoTileProps) {
  return (
    <div
      className={clsx(
        "flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] px-6 py-5 transition-all",
        "hover:border-amber-500/30 hover:bg-white/[0.04]",
        className
      )}
    >
      <img
        src={src}
        alt={decorative ? "" : alt}
        aria-hidden={decorative ? true : undefined}
        height={size}
        loading="lazy"
        className={clsx(
          "w-auto object-contain opacity-70 grayscale transition-all duration-300",
          "hover:opacity-100 hover:grayscale-0",
          "max-h-10"
        )}
      />
    </div>
  );
}