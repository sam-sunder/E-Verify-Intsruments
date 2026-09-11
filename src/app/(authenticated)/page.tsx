"use client";

import { useSession } from "@/lib/auth/session-provider";
import { ShellHome } from "@/components/shell/app-shell";
import { BusinessOwnerDashboard } from "@/components/business-owner/dashboard";
import { OfficerDashboard } from "@/components/officer/dashboard";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default function HomePage() {
  const { user } = useSession();

  if (user?.role === "BUSINESS_OWNER") {
    return <BusinessOwnerDashboard userName={user.fullName} />;
  }

  if (user?.role === "OFFICER") {
    return <OfficerDashboard userName={user.fullName} />;
  }

  if (user?.role === "ADMINISTRATOR") {
    return <AdminDashboard userName={user.fullName} />;
  }

  return <ShellHome userName={user?.fullName ?? ""} role={user?.role ?? ""} />;
}
