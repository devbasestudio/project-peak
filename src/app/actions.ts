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

  const { data: order, error } = await supabase.rpc("get_or_create_payment_order");
  if (error) throw error;
  if (!order) throw new Error("Payment order is unavailable");
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

  const { data: movements, error: movementsError } = await supabase
    .from("program_assessment_movements")
    .select("id")
    .eq("program_id", programId)
    .eq("assessment_kind", "baseline");
  if (movementsError) throw movementsError;
  const allowedIds = new Set((movements ?? []).map((movement) => movement.id));
  const suppliedIds = new Set(values.map((item) => item.movementId));
  if (allowedIds.size === 0 || suppliedIds.size !== allowedIds.size || [...suppliedIds].some((id) => !allowedIds.has(id))) {
    throw new Error("Baseline movements do not match this program");
  }

  const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Yangon" }).format(new Date());
  const { data: attemptId, error } = await supabase.rpc("save_baseline_assessment", {
    p_program_id: programId,
    p_local_date: localDate,
    p_values: values,
  });
  if (error) throw error;
  if (!attemptId) throw new Error("Baseline was not saved");
  revalidatePath(`/${locale}/app`);
  redirect(`/${locale}/app`);
}
