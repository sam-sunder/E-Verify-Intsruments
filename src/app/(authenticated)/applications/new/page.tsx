import { Suspense } from "react";
import { CreateApplication } from "@/components/business-owner/create-application";
import { LoadingState } from "@/components/ui/states";

export const metadata = {
  title: "New Verification Application | e-VerifyMet",
  description: "Submit instrument for legal metrology verification",
};

export default function NewApplicationPage() {
  return (
    <Suspense fallback={<LoadingState label="Preparing application workspace…" />}>
      <CreateApplication />
    </Suspense>
  );
}
