import { ApplicationsList } from "@/components/business-owner/applications-list";

export const metadata = {
  title: "My Applications | e-VerifyMet",
  description: "Track verification and stamping applications",
};

export default function ApplicationsPage() {
  return <ApplicationsList />;
}
