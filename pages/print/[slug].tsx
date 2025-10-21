import BrandFrame from "@/components/print/BrandFrame";
import { useMDXComponent } from "next-contentlayer2/hooks";
import { components } from "@/components/MdxComponents";

export default function PrintFallback() {
  // empty MDX – keeps the hook unconditional and harmless
  const MDXContent = useMDXComponent("");

  return (
    <BrandFrame title="Print" subtitle="">
      <article className="prose mx-auto max-w-none">
        <p>Nothing to print for this route.</p>
        <MDXContent components={components as any} />
      </article>
    </BrandFrame>
  );
}
