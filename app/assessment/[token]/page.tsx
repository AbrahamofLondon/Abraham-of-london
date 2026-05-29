// Server wrapper for enterprise assessment page
// Auth and data loading handled by parent layout
import EnterpriseAssessmentPageClient from "./PageClient";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function EnterpriseAssessmentPage({ params }: PageProps) {
  const { token } = await params;
  return <EnterpriseAssessmentPageClient params={{ token }} />;
}