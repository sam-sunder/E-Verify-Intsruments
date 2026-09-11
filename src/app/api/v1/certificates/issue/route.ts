import { NextRequest, NextResponse } from "next/server";
import { digitalCertificateService } from "@/server/services/digital-certificate-service";
import { currentPrincipal } from "@/server/auth";
import { ApiError } from "@/server/api";

export async function POST(req: NextRequest) {
  try {
    const principal = await currentPrincipal();
    if (!principal) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
    }

    const body = await req.json();
    const { verificationId, validTo, validFrom, documentHash } = body;

    if (!verificationId || !validTo) {
      return NextResponse.json({ error: { code: "MISSING_FIELDS", message: "verificationId and validTo are required" } }, { status: 400 });
    }

    const certificate = await digitalCertificateService.issue(principal, verificationId, {
      validTo: new Date(validTo),
      validFrom: validFrom ? new Date(validFrom) : undefined,
      documentHash,
    });

    return NextResponse.json({ data: certificate });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status || 400 });
    }
    console.error("Certificate issuance error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" } }, { status: 500 });
  }
}
