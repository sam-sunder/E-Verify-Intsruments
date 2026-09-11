import { AdminCertificateDetail } from "@/components/admin/admin-certificate-detail";

export default async function AdminCertificateDetailPage({ params }: { params: Promise<{ certificateNumber: string }> }) {
  const { certificateNumber } = await params;
  return <AdminCertificateDetail certificateNumber={certificateNumber} />;
}
