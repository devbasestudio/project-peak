import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { rejectPaymentRegistration } from "@/lib/paymentReview";

export async function POST(request: Request) {
  const { supabase, error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { registrationId } = await request.json();
    if (!registrationId) {
      return NextResponse.json({ error: "registrationId is required" }, { status: 400 });
    }

    await rejectPaymentRegistration(supabase, registrationId);

    return NextResponse.json({ success: true, persistedStatus: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Rejection failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
