import { NextRequest, NextResponse } from "next/server";
import { fieldVerificationService } from "@/server/services/field-verification-service";
import { currentPrincipal } from "@/server/auth";
import { ApiError } from "@/server/api";

export async function GET(req: NextRequest, { params }: { params: Promise<{ applicationNumber: string }> }) {
  try {
    const principal = await currentPrincipal();
    if (!principal) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
    }

    const { applicationNumber } = await params;
    const verification = await fieldVerificationService.getByApplication(principal, applicationNumber);

    return NextResponse.json({ data: verification });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status || 400 });
    }
    console.error("Error fetching verification by application:", error);
    return NextResponse.json({ error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" } }, { status: 500 });
  }
}
