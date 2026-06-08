import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

const MAX_DEVICES = 2;

export async function POST(request: Request) {
  try {
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { deviceId, userAgent } = await request.json();
    if (!deviceId) {
      return NextResponse.json({ error: "deviceId is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: devices, error: listError } = await supabase
      .from("user_devices")
      .select("device_id")
      .eq("user_id", user.id);

    if (listError) {
      return NextResponse.json({ success: true, persisted: false, note: "Device table not migrated yet." });
    }

    const known = (devices || []).some((device: any) => device.device_id === deviceId);
    if (!known && (devices || []).length >= MAX_DEVICES) {
      return NextResponse.json({ error: "Device limit reached. Please request a device reset." }, { status: 403 });
    }

    const { error: upsertError } = await supabase.from("user_devices").upsert(
      {
        user_id: user.id,
        device_id: deviceId,
        user_agent: userAgent || "",
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "user_id,device_id" },
    );

    return NextResponse.json({ success: true, persisted: !upsertError });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Device registration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
