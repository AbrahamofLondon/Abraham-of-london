// components/icons/SocialIcons/BrandLogo.tsx
import * as React from "react";

export type BrandLogoProps = React.SVGProps<SVGSVGElement>;

export function BrandLogo(props: BrandLogoProps): JSX.Element {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="Abraham of London"
      {...props}
    >
      <circle cx="32" cy="32" r="30" className="fill-forest" strokeWidth={0} />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-warmWhite"
        fontSize="22"
        fontFamily="serif"
      >
        A
      </text>
    </svg>
  );
}

export default BrandLogo;
