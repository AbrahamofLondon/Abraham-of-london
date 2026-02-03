/* components/BriefRenderer.tsx — SECURE MDX HYDRATION */
import { MDXRemote, MDXRemoteProps } from "next-mdx-remote";
import { ShieldCheck, Info, AlertTriangle, TrendingUp } from "lucide-react";

/**
 * Custom Components: These can be used directly inside your MDX files.
 * Example: <BriefAlert type="warning">Sensitive Data</BriefAlert>
 */
const mdxComponents = {
  h2: (props: any) => <h2 className="text-2xl font-serif italic text-white mt-12 mb-4" {...props} />,
  h3: (props: any) => <h3 className="text-lg font-bold text-amber-500 mt-8 mb-2 tracking-widest uppercase" {...props} />,
  p: (props: any) => <p className="leading-[1.8] text-zinc-300 mb-6 font-light" {...props} />,
  
  // Custom Institutional Callouts
  BriefAlert: ({ children, type = "info" }: { children: React.ReactNode, type: string }) => (
    <div className={`my-8 p-6 border-l-2 flex gap-4 ${
      type === 'warning' ? 'bg-rose-500/5 border-rose-500' : 'bg-amber-500/5 border-amber-500'
    }`}>
      {type === 'warning' ? <AlertTriangle className="text-rose-500 shrink-0" /> : <Info className="text-amber-500 shrink-0" />}
      <div className="text-sm italic font-serif text-zinc-400">{children}</div>
    </div>
  ),
  
  DataNode: ({ label, value }: { label: string, value: string }) => (
    <div className="inline-flex flex-col border-r border-white/10 pr-6 mr-6 last:border-0">
      <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">{label}</span>
      <span className="text-sm font-mono text-white">{value}</span>
    </div>
  ),
};

export function BriefRenderer({ source }: { source: MDXRemoteProps }) {
  return (
    <div className="brief-content-wrapper">
      <MDXRemote {...source} components={mdxComponents} />
    </div>
  );
}