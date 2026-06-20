import {
  ensureTelegramUserAccount,
  isAdminTelegramId,
  programDefaults,
  toProgramType,
} from "@/lib/adminAuth";
import { saveUserProgram } from "@/lib/userProgram";

export async function approvePaymentRegistration(supabase: any, registrationId: string | number) {
  const { data: registration, error: registrationError } = await supabase
    .from("program_registrations")
    .select("*")
    .eq("id", registrationId)
    .maybeSingle();

  if (registrationError) throw registrationError;
  if (!registration) {
    throw new Error("Registration not found");
  }

  const paymentStatus = String(registration.payment_status || "").toLowerCase();
  if (paymentStatus !== "pending") {
    throw new Error("Only submitted payment screenshots can be approved.");
  }
  if (!registration.payment_screenshot) {
    throw new Error("Payment screenshot is required before approval.");
  }

  let userId = registration.user_id || "";
  let email = registration.email || "";
  const telegramId = String(registration.telegram_id || "").replace(/^@/, "");

  if (!userId && telegramId && !isAdminTelegramId(telegramId)) {
    const account = await ensureTelegramUserAccount({
      telegramId,
      username: registration.name || "",
      firstName: registration.name || "",
      email,
    });
    userId = account.userId;
    email = account.email || email;
  }

  if (userId) {
    const programType = toProgramType(registration.program_name);
    const durationMonths = Number(registration.duration_months || 3);
    const today = new Date().toISOString().split("T")[0];
    await saveUserProgram(supabase, {
      user_id: userId,
      program_type: programType,
      duration_weeks: Math.max(4, durationMonths * 4),
      start_date: today,
      ...programDefaults(programType),
    });
  }

  const { error: updateError } = await supabase
    .from("program_registrations")
    .update({
      ...(userId ? { user_id: userId } : {}),
      ...(email ? { email } : {}),
      status: "approved",
      payment_status: "approved",
      approved_at: new Date().toISOString(),
    })
    .eq("id", registration.id);

  if (updateError) throw updateError;

  try {
    await supabase.from("admin_notifications").insert({
      type: "payment_approved",
      title: "Payment approved",
      body: `${registration.name || "Client"} payment approved. Build custom tracker next.`,
      data: { registrationId: registration.id, userId: userId || registration.user_id },
      read: false,
    });
  } catch {
    // Optional migration table. Approval should keep working without it.
  }

  return { ...registration, user_id: userId || registration.user_id, email: email || registration.email };
}

export async function rejectPaymentRegistration(supabase: any, registrationId: string | number) {
  const { data: registration, error: registrationError } = await supabase
    .from("program_registrations")
    .select("*")
    .eq("id", registrationId)
    .maybeSingle();

  if (registrationError) throw registrationError;
  if (!registration) {
    throw new Error("Registration not found");
  }

  const { error: updateError } = await supabase
    .from("program_registrations")
    .update({
      status: "pending",
      payment_status: "rejected",
      notes: `${registration.notes || ""}\nPayment rejected by admin.`.trim(),
    })
    .eq("id", registration.id);

  if (updateError) throw updateError;

  try {
    await supabase.from("admin_notifications").insert({
      type: "payment_rejected",
      title: "Payment rejected",
      body: `${registration.name || "Client"} payment was rejected.`,
      data: { registrationId: registration.id, userId: registration.user_id },
      read: false,
    });
  } catch {
    // Optional migration table. Rejection should keep working without it.
  }

  return registration;
}
