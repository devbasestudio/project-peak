import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST() {
  try {
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("user_devices").delete().eq("user_id", user.id);

    return NextResponse.json({
      success: true,
      persisted: !error,
      note: error ? "Device table not migrated yet." : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Device reset failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
