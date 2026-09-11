import { InstrumentsList } from "@/components/business-owner/instruments-list";

export const metadata = {
  title: "My Instruments | e-VerifyMet",
  description: "Manage regulated weighing and measuring instruments",
};

export default function InstrumentsPage() {
  return <InstrumentsList />;
}
