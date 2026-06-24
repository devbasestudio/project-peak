import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { ensureTelegramUserAccount, programDefaults, toProgramType } from "@/lib/adminAuth";
import { saveUserProgram } from "@/lib/userProgram";

export type AdminClient = {
  id: string;
  username: string;
  email: string;
  duration_weeks: number | null;
  start_date: string | null;
  telegram_id?: string | null;
  program_name?: string | null;
  payment_status?: string | null;
  registration_id?: string | number | null;
  canOpenProfile: boolean;
};

export function isPendingRegistration(registration: any) {
  return (
    String(registration?.payment_status || "").toLowerCase() === "pending"
    && Boolean(registration?.payment_screenshot)
  );
}

export async function getClients(): Promise<AdminClient[]> {
  noStore();
  const supabase = createAdminClient();

  const registrations = await getRegistrations();
  await repairApprovedRegistrationAccounts(registrations);
  const refreshedRegistrations = registrations.some((registration) => {
    const status = String(registration.payment_status || registration.status || "").toLowerCase();
    return !registration.user_id && (status === "approved" || status === "ready");
  })
    ? await getRegistrations()
    : registrations;

  const userIds = Array.from(
    new Set(refreshedRegistrations.map((registration) => registration.user_id).filter(Boolean)),
  );

  const [profilesResult, programsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, email, telegram_id")
      .eq("role", "user"),
    userIds.length
      ? supabase
          .from("programs")
          .select("user_id, duration_weeks, start_date")
          .in("user_id", userIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (profilesResult.error) throw profilesResult.error;
  if (programsResult.error) throw programsResult.error;

  const profileById = new Map((profilesResult.data || []).map((profile: any) => [profile.id, profile]));
  const programByUserId = new Map((programsResult.data || []).map((program: any) => [program.user_id, program]));
  const clientsByKey = new Map<string, AdminClient>();

  for (const registration of refreshedRegistrations) {
    const paymentStatus = String(registration.payment_status || registration.status || "").toLowerCase();
    const isClientLike = ["awaiting_payment", "pending", "approved", "ready", "rejected"].includes(paymentStatus);
    if (!isClientLike) continue;

    const profile = registration.user_id ? profileById.get(registration.user_id) : null;
    const program = registration.user_id ? programByUserId.get(registration.user_id) : null;
    const key = registration.user_id || `registration-${registration.id}`;
    if (clientsByKey.has(key)) continue;

    clientsByKey.set(key, {
      id: registration.user_id || String(registration.id),
      username: profile?.username || registration.name || registration.username || "Telegram client",
      email: profile?.email || registration.email || "",
      duration_weeks: program?.duration_weeks || (registration.duration_months ? Number(registration.duration_months) * 4 : null),
      start_date: program?.start_date || null,
      telegram_id: profile?.telegram_id || registration.telegram_id || null,
      program_name: registration.program_name || null,
      payment_status: paymentStatus || null,
      registration_id: registration.id,
      canOpenProfile: Boolean(registration.user_id),
    });
  }

  for (const profile of profilesResult.data || []) {
    if (clientsByKey.has(profile.id)) continue;
    const program = programByUserId.get(profile.id);
    clientsByKey.set(profile.id, {
      id: profile.id,
      username: profile.username || "Client",
      email: profile.email || "",
      duration_weeks: program?.duration_weeks || null,
      start_date: program?.start_date || null,
      telegram_id: profile.telegram_id || null,
      payment_status: "profile",
      canOpenProfile: true,
    });
  }

  return Array.from(clientsByKey.values());
}

async function repairApprovedRegistrationAccounts(registrations: any[]) {
  noStore();
  const supabase = createAdminClient();
  const orphaned = registrations.filter((registration) => {
    const status = String(registration.payment_status || registration.status || "").toLowerCase();
    return !registration.user_id && registration.telegram_id && (status === "approved" || status === "ready");
  });

  for (const registration of orphaned) {
    try {
      const account = await ensureTelegramUserAccount({
        telegramId: String(registration.telegram_id),
        username: registration.name || "",
        firstName: registration.name || "",
        email: registration.email || "",
      });
      const programType = toProgramType(registration.program_name, registration.program_key);
      const durationMonths = Number(registration.duration_months || 3);
      await saveUserProgram(supabase, {
        user_id: account.userId,
        program_type: programType,
        duration_weeks: Math.max(4, durationMonths * 4),
        start_date: new Date().toISOString().split("T")[0],
        ...programDefaults(programType),
      });
      await supabase
        .from("program_registrations")
        .update({ user_id: account.userId, email: account.email })
        .eq("id", registration.id);
    } catch (err) {
      console.error("Registration account repair failed:", err);
    }
  }
}

export async function getDeviceSummaries() {
  noStore();
  const supabase = createAdminClient();
  const clients = await getClients();
  const userIds = clients.filter((client) => client.canOpenProfile).map((client) => client.id);
  const { data: devices, error } = userIds.length
    ? await supabase
        .from("user_devices")
        .select("user_id, device_id, user_agent, last_seen_at")
        .in("user_id", userIds)
    : { data: [], error: null };

  if (error) throw error;
  const byUser = new Map<string, any[]>();
  for (const device of devices || []) {
    byUser.set(device.user_id, [...(byUser.get(device.user_id) || []), device]);
  }

  return clients.map((client) => ({
    id: client.id,
    username: client.username,
    email: client.email,
    telegram_id: client.telegram_id || "",
    devices: byUser.get(client.id) || [],
    canOpenProfile: client.canOpenProfile,
  }));
}

export async function getLegacyProfileClients(): Promise<AdminClient[]> {
  noStore();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      `id, username, email, programs ( duration_weeks, start_date )`,
    )
    .eq("role", "user");

  if (error) throw error;

  return (data || []).map((p: any) => ({
    id: p.id,
    username: p.username,
    email: p.email,
    duration_weeks: p.programs?.[0]?.duration_weeks || null,
    start_date: p.programs?.[0]?.start_date || null,
    canOpenProfile: true,
  }));
}

export async function getRegistrations(): Promise<any[]> {
  noStore();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("program_registrations")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getPendingPaymentCount(): Promise<number> {
  noStore();
  const registrations = await getRegistrations();
  return registrations.filter((r) => isPendingRegistration(r)).length;
}

export async function getRecentCheckins(limit = 15): Promise<any[]> {
  noStore();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("weekly_checkins")
    .select("id, user_id, week_number, admin_feedback, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  const userIds = Array.from(new Set((data || []).map((c: any) => c.user_id).filter(Boolean)));
  const { data: profiles, error: profileError } = userIds.length
    ? await supabase.from("profiles").select("id, username").in("id", userIds)
    : { data: [], error: null };
  if (profileError) throw profileError;
  const profileById = new Map((profiles || []).map((profile: any) => [profile.id, profile]));

  return (data || []).map((c: any) => ({
    id: c.id,
    user_id: c.user_id,
    username: profileById.get(c.user_id)?.username || "Client",
    week_number: c.week_number,
    admin_feedback: c.admin_feedback,
    created_at: c.created_at,
  }));
}
