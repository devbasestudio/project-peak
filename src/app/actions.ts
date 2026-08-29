"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export async function signOut(locale = "mm") {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale}`);
}

export async function createPurchaseOrder(locale = "mm") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data: existing } = await supabase
    .from("payment_orders")
    .select("id")
    .eq("user_id", user.id)
    .in("status", ["awaiting_payment", "submitted", "approved"])
    .maybeSingle();

  if (!existing) {
    const { data: offer } = await supabase.from("offers").select("id, price_minor, currency").eq("active", true).limit(1).single();
    if (!offer) throw new Error("Active offer is unavailable");
    const reference = `PEAK-${user.id.slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const { error } = await supabase.from("payment_orders").insert({
      user_id: user.id,
      offer_id: offer.id,
      amount_minor: offer.price_minor,
      currency: offer.currency,
      reference_code: reference,
      status: "awaiting_payment",
    });
    if (error) throw error;
  }
  revalidatePath(`/${locale}/app`);
}

const baselineValuesSchema = z.array(z.object({ movementId: z.string().uuid(), value: z.number().int().min(0).max(999) })).min(1).max(12);

export async function saveBaseline(programId: string, rawValues: Array<{ movementId: string; value: number }>, locale = "mm") {
  const values = baselineValuesSchema.parse(rawValues);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data: program } = await supabase.from("programs").select("id").eq("id", programId).eq("user_id", user.id).eq("status", "active").single();
  if (!program) throw new Error("Program not found");

  const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Yangon" }).format(new Date());
  const { data: attempt, error: attemptError } = await supabase.from("assessment_attempts").upsert({
    program_id: programId,
    kind: "baseline",
    status: "completed",
    local_date: localDate,
    completed_at: new Date().toISOString(),
  }, { onConflict: "program_id,kind" }).select("id").single();
  if (attemptError) throw attemptError;

  const { error } = await supabase.from("assessment_results").upsert(values.map((item) => ({
    attempt_id: attempt.id,
    movement_id: item.movementId,
    value: item.value,
  })), { onConflict: "attempt_id,movement_id" });
  if (error) throw error;
  revalidatePath(`/${locale}/app`);
  redirect(`/${locale}/app`);
}
