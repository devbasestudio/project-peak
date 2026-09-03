"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isLocale, type Locale } from "@/lib/i18n";

const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  preferredLocale: z.enum(["mm", "en"]),
});

const assessmentValuesSchema = z
  .array(z.object({ movementId: z.string().uuid(), value: z.number().int().min(0).max(999) }))
  .min(1)
  .max(12);

const weeklyScheduleSchema = z.object({
  programId: z.string().uuid(),
  weekNumber: z.number().int().min(1).max(12),
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).length(4),
  locale: z.enum(["mm", "en"]),
});

export type CustomerActionResult = { ok: true } | { ok: false; message: string };

export async function saveWeeklySchedule(raw: {
  programId: string;
  weekNumber: number;
  dates: string[];
  locale: Locale;
}): Promise<CustomerActionResult> {
  const parsed = weeklyScheduleSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: raw.locale === "mm" ? "ရွေးထားတဲ့ရက်တွေကို ပြန်စစ်ပေးပါ။" : "Please check the selected dates." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${parsed.data.locale}/login?next=${encodeURIComponent(`/${parsed.data.locale}/app/schedule`)}`);

  const { error } = await supabase.rpc("save_weekly_schedule", {
    p_program_id: parsed.data.programId,
    p_week_number: parsed.data.weekNumber,
    p_dates: parsed.data.dates,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/${parsed.data.locale}/app`);
  revalidatePath(`/${parsed.data.locale}/app/schedule`);
  revalidatePath(`/${parsed.data.locale}/app/workout`);
  return { ok: true };
}

export async function updateCustomerProfile(raw: {
  displayName: string;
  preferredLocale: Locale;
}): Promise<CustomerActionResult> {
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Please check your profile details." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${parsed.data.preferredLocale}/login`);

  const { error } = await supabase
    .from("profiles")
    .update({
      id: user.id,
      display_name: parsed.data.displayName,
      preferred_locale: parsed.data.preferredLocale,
      avatar_url: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { ok: false, message: error.message };
  revalidatePath(`/${parsed.data.preferredLocale}/app`, "layout");
  return { ok: true };
}

export async function saveFinalAssessment(
  programId: string,
  rawValues: Array<{ movementId: string; value: number }>,
  locale: Locale,
): Promise<CustomerActionResult> {
  if (!isLocale(locale)) return { ok: false, message: "Unsupported locale." };
  const parsedProgramId = z.string().uuid().safeParse(programId);
  const parsedValues = assessmentValuesSchema.safeParse(rawValues);
  if (!parsedProgramId.success || !parsedValues.success) {
    return { ok: false, message: locale === "mm" ? "Result တွေကို ပြန်စစ်ကြည့်ပါ" : "Please check the assessment results." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/app/completion`)}`);

  const [{ data: program }, { count: completedSessions }, { data: movements }] = await Promise.all([
    supabase
      .from("programs")
      .select("id")
      .eq("id", parsedProgramId.data)
      .eq("user_id", user.id)
      .in("status", ["active", "completed"])
      .maybeSingle(),
    supabase
      .from("workout_sessions")
      .select("id", { count: "exact", head: true })
      .eq("program_id", parsedProgramId.data)
      .eq("status", "completed"),
    supabase
      .from("program_assessment_movements")
      .select("id")
      .eq("program_id", parsedProgramId.data)
      .eq("assessment_kind", "final"),
  ]);

  if (!program) return { ok: false, message: locale === "mm" ? "Program ကို ရှာမတွေ့ဘူး" : "Program not found." };
  if ((completedSessions ?? 0) < 47) {
    return { ok: false, message: locale === "mm" ? "Session 47 ပြီးမှ Final Challenge စလို့ရမယ်" : "Complete session 47 before starting the final challenge." };
  }

  const allowedIds = new Set((movements ?? []).map((movement) => movement.id));
  if (allowedIds.size !== parsedValues.data.length || parsedValues.data.some((item) => !allowedIds.has(item.movementId))) {
    return { ok: false, message: locale === "mm" ? "Final movements မကိုက်ညီဘူး" : "The final movements do not match this program." };
  }

  const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Yangon" }).format(new Date());
  const { error } = await supabase.rpc("complete_final_challenge", {
    p_program_id: parsedProgramId.data,
    p_local_date: localDate,
    p_values: parsedValues.data,
    p_mutation_id: crypto.randomUUID(),
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/${locale}/app`);
  revalidatePath(`/${locale}/app/completion`);
  revalidatePath(`/${locale}/app/progress`);
  return { ok: true };
}
