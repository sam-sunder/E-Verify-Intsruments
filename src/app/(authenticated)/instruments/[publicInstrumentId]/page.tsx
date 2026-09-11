import { InstrumentPassport } from "@/components/business-owner/instrument-passport";

type PageProps = {
  params: Promise<{ publicInstrumentId: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { publicInstrumentId } = await params;
  return {
    title: `Instrument Passport ${publicInstrumentId} | e-VerifyMet`,
  };
}

export default async function InstrumentPassportPage({ params }: PageProps) {
  const { publicInstrumentId } = await params;
  return <InstrumentPassport publicInstrumentId={publicInstrumentId} />;
}
