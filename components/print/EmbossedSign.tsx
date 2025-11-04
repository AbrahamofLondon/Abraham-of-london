import Image from "next/image";

type Props = {
  src: string;
  width?: number;
  height?: number;
  alt?: string;
  className?: string;
  baseColor?: string;
};

export default function EmbossedSign({
  src,
  width = 140,
  height = 40,
  alt = "Signature",
  className = "",
}: Props) {
  return (
    <div className={`inline-block opacity-80 ${className}`}>
      <Image src={src} alt={alt} width={width} height={height} />
    </div>
  );
}
