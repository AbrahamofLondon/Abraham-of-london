// components/LogoTile.tsx
import Image from "next/image";

type LogoTileProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
};

export default function LogoTile({
  src,
  alt,
  width = 140,
  height = 140,
  className = "",
}: LogoTileProps) {
  return (
    <div className={`relative w-[140px] h-[140px] mx-auto ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="object-contain"
        loading="lazy"
        sizes="(max-width: 768px) 140px, 140px"
      />
    </div>
  );
}
