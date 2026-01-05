// app/board/pdfs/page.tsx — Server Wrapper (Export-safe)

import dynamic from "next/dynamic";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PDFDashboardClient = dynamic(() => import("./PDFDashboardClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#0a0b0d] text-white flex items-center justify-center">
      <div className="text-sm text-gray-300">Loading PDF Intelligence…</div>
    </div>
  ),
});

export default function PDFDashboardPage() {
  return <PDFDashboardClient />;
}