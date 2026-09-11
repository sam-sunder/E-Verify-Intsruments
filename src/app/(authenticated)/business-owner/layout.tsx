import { redirect } from "next/navigation";
import { currentPrincipal } from "@/server/auth";
import { UserRole } from "@prisma/client";

export default async function BusinessOwnerLayout({ children }: { children: React.ReactNode }) {
  const principal = await currentPrincipal();

  if (!principal || (principal.role !== UserRole.BUSINESS_OWNER && principal.role !== UserRole.ADMINISTRATOR)) {
    redirect("/unauthorized");
  }

  return <>{children}</>;
}
