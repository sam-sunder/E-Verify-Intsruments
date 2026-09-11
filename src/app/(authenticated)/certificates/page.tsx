import { CertificatesList } from "@/components/business-owner/certificates-list";

export const metadata = {
  title: "My Certificates | e-VerifyMet",
  description: "Official Legal Metrology digital certificates and stamps",
};

export default function CertificatesPage() {
  return <CertificatesList />;
}
