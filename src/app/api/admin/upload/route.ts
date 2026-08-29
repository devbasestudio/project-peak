import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const maxBytes = 75 * 1024 * 1024;
const allowed = new Set(["video/mp4", "video/webm", "video/quicktime", "image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file to upload" }, { status: 400 });
  if (!allowed.has(file.type)) return NextResponse.json({ error: "Use MP4, WebM, MOV, JPEG, PNG, or WebP" }, { status: 415 });
  if (file.size <= 0 || file.size > maxBytes) return NextResponse.json({ error: "File must be smaller than 75 MB" }, { status: 413 });

  const extension = (file.name.split(".").pop() || (file.type.startsWith("video/") ? "mp4" : "jpg")).replace(/[^a-z0-9]/gi, "").toLowerCase();
  const objectPath = `program-editor/${viewer.user.id}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;
  const admin = createAdminClient();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage.from("site-assets").upload(objectPath, bytes, { contentType: file.type, upsert: false, cacheControl: "31536000" });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: publicData } = admin.storage.from("site-assets").getPublicUrl(objectPath);
  const { data: asset, error: assetError } = await admin.from("media_assets").insert({
    bucket_id: "site-assets",
    object_path: objectPath,
    kind: file.type.startsWith("video/") ? "video" : "image",
    mime_type: file.type,
    byte_size: file.size,
    uploaded_by: viewer.user.id,
  }).select("id").single();
  if (assetError) {
    await admin.storage.from("site-assets").remove([objectPath]);
    return NextResponse.json({ error: assetError.message }, { status: 500 });
  }
  return NextResponse.json({ url: publicData.publicUrl, assetId: asset.id, path: objectPath });
}
