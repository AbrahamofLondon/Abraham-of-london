// Server wrapper for new campaign page
// Auth and data loading handled by parent layout (app/admin/layout.tsx)
import NewCampaignPageClient from "./PageClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function NewCampaignPage({ params }: PageProps) {
  const { id } = await params;
  return <NewCampaignPageClient params={{ id }} />;
}