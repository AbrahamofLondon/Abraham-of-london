// lib/MDXBody.tsx
import { useMDXComponent } from "next-contentlayer2/hooks";

export function MDXBody({ code }: { code?: string }) {
  const safe = code ?? "export default function Empty(){ return null }";
  const Component = useMDXComponent(safe);
  return <Component />;
}
