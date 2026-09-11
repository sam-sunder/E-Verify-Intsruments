import { ApplicationDetail } from "@/components/business-owner/application-detail";

type PageProps = {
  params: Promise<{ applicationNumber: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { applicationNumber } = await params;
  return {
    title: `Application ${applicationNumber} | e-VerifyMet`,
  };
}

export default async function ApplicationDetailPage({ params }: PageProps) {
  const { applicationNumber } = await params;
  return <ApplicationDetail applicationNumber={applicationNumber} />;
}
