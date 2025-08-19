// components/LogoWall.tsx
import LogoTile from "./LogoTile";

type Logo = {
  src: string;
  alt: string;
  size?: number;
};

type LogoWallProps = {
  logos: Logo[];
  className?: string;
};

export default function LogoWall({ logos, className }: LogoWallProps) {
  return (
    <div
      className={`
        grid gap-8 justify-items-center
        grid-cols-[repeat(auto-fit,minmax(140px,1fr))]
        ${className ?? ""}
      `}
    >
      {logos.map((logo, idx) => (
        <LogoTile key={idx} {...logo} />
      ))}
    </div>
  );
}
