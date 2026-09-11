import { AdminApplicationReview } from "@/components/admin/admin-application-review";

export default async function AdminApplicationReviewPage({ params }: { params: Promise<{ applicationNumber: string }> }) {
  const { applicationNumber } = await params;
  return <AdminApplicationReview applicationNumber={applicationNumber} />;
}
