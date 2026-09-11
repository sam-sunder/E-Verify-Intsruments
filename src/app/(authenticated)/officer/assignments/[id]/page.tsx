"use client";

import { use } from "react";
import { AssignmentDetail } from "@/components/officer/assignment-detail";

export default function OfficerAssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AssignmentDetail assignmentId={id} />;
}
