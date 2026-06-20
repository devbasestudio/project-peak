import { createAdminClient } from "@/utils/supabase/admin";

export type AdminClient = {
  id: string;
  username: string;
  email: string;
  duration_weeks: number | null;
  start_date: string | null;
};

export function isPendingRegistration(registration: any) {
  return (
    String(registration?.payment_status || "").toLowerCase() === "pending"
    && Boolean(registration?.payment_screenshot)
  );
}

export async function getClients(): Promise<AdminClient[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      `id, username, email, programs ( duration_weeks, start_date )`,
    )
    .eq("role", "user");

  return (data || []).map((p: any) => ({
    id: p.id,
    username: p.username,
    email: p.email,
    duration_weeks: p.programs?.[0]?.duration_weeks || null,
    start_date: p.programs?.[0]?.start_date || null,
  }));
}

export async function getRegistrations(): Promise<any[]> {
  const supabase = createAdminClient();
  try {
    const { data } = await supabase
      .from("program_registrations")
      .select("*")
      .order("created_at", { ascending: false });
    return data || [];
  } catch (err) {
    console.error("Error fetching registrations:", err);
    return [];
  }
}

export async function getPendingPaymentCount(): Promise<number> {
  const registrations = await getRegistrations();
  return registrations.filter((r) => isPendingRegistration(r)).length;
}

export async function getRecentCheckins(limit = 15): Promise<any[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("weekly_checkins")
    .select(
      `id, user_id, week_number, admin_feedback, created_at, profiles:user_id ( username )`,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []).map((c: any) => ({
    id: c.id,
    user_id: c.user_id,
    username: c.profiles?.username || "Client",
    week_number: c.week_number,
    admin_feedback: c.admin_feedback,
    created_at: c.created_at,
  }));
}
