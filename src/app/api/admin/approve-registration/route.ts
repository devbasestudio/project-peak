import { NextResponse } from "next/server";
import { appBaseUrl, requireAdmin } from "@/lib/adminAuth";
import { approvePaymentRegistration } from "@/lib/paymentReview";
import { notifyAdminsApproval } from "@/lib/telegram";

export async function POST(request: Request) {
  const { supabase, error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { registrationId } = await request.json();
    if (!registrationId) {
      return NextResponse.json({ error: "registrationId is required" }, { status: 400 });
    }

    const registration = await approvePaymentRegistration(supabase, registrationId);
    await notifyAdminsApproval(registration, appBaseUrl(request)).catch(() => null);

    return NextResponse.json({ success: true, persistedStatus: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Approval failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
