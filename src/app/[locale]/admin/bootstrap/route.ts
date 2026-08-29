import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  secret: z.string().min(16).max(500),
  email: z.string().email().max(320),
  password: z.string().min(12).max(200),
  displayName: z.string().trim().min(1).max(120).default("Project Peak Admin"),
});

function sameSecret(value: string, expected: string) {
  const left = Buffer.from(value);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  const expectedSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
  if (!expectedSecret) return NextResponse.json({ error: "Bootstrap is not configured" }, { status: 503 });

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success || !sameSecret(parsed.data.secret, expectedSecret)) {
    return NextResponse.json({ error: "Invalid bootstrap request" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { count, error: countError } = await supabase.from("admin_users").select("user_id", { count: "exact", head: true });
  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });
  if ((count ?? 0) > 0) return NextResponse.json({ error: "An administrator already exists" }, { status: 409 });

  const normalizedEmail = parsed.data.email.trim().toLowerCase();
  const { data: listed, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });
  let user = listed.users.find((candidate) => candidate.email?.toLowerCase() === normalizedEmail) ?? null;

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password: parsed.data.password,
      email_confirm: true,
      app_metadata: { role: "admin" },
      user_metadata: { full_name: parsed.data.displayName },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    user = data.user;
  } else {
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      password: parsed.data.password,
      app_metadata: { ...user.app_metadata, role: "admin" },
      user_metadata: { ...user.user_metadata, full_name: parsed.data.displayName },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    user = data.user;
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    display_name: parsed.data.displayName,
    preferred_locale: "en",
  }, { onConflict: "id" });
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  const { error: bootstrapError } = await supabase.rpc("bootstrap_first_admin", { p_user_id: user.id });
  if (bootstrapError) return NextResponse.json({ error: bootstrapError.message }, { status: 500 });

  return NextResponse.json({ ok: true, message: "First administrator created. Rotate ADMIN_BOOTSTRAP_SECRET now." }, { status: 201 });
}

