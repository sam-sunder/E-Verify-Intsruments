import { AdminInstrumentDetail } from "@/components/admin/admin-instrument-detail";

export default async function AdminInstrumentDetailPage({ params }: { params: Promise<{ publicInstrumentId: string }> }) {
  const { publicInstrumentId } = await params;
  return <AdminInstrumentDetail publicInstrumentId={publicInstrumentId} />;
}
