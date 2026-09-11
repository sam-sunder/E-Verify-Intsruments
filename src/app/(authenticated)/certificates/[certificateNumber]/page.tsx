import { CertificateDetail } from "@/components/business-owner/certificate-detail";

type PageProps = {
  params: Promise<{ certificateNumber: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { certificateNumber } = await params;
  return {
    title: `Certificate ${certificateNumber} | e-VerifyMet`,
  };
}

export default async function CertificateDetailPage({ params }: PageProps) {
  const { certificateNumber } = await params;
  return <CertificateDetail certificateNumber={certificateNumber} />;
}
