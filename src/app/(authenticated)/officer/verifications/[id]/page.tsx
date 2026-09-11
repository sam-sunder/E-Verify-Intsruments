"use client";

import { use } from "react";
import { FieldVerificationFlow } from "@/components/officer/field-verification-flow";

export default function OfficerFieldVerificationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <FieldVerificationFlow verificationId={id} />;
}
