import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ASSET_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FORWARDED_HEADERS = ["accept-ranges", "content-length", "content-range", "content-type", "etag", "last-modified"];

async function streamMemberMedia(request: NextRequest, assetId: string, headOnly = false) {
  if (!ASSET_ID.test(assetId)) return NextResponse.json({ error: "Media not found" }, { status: 404 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  // This query runs as the member. RLS confirms that the asset belongs to the
  // member's purchased program before privileged storage access is used.
  const { data: asset, error: assetError } = await supabase
    .from("media_assets")
    .select("id,bucket_id,object_path,mime_type")
    .eq("id", assetId)
    .maybeSingle();
  if (assetError || !asset) return NextResponse.json({ error: "Media not found" }, { status: 404 });

  const { data: signed, error: signedError } = await supabase.storage
    .from(asset.bucket_id)
    .createSignedUrl(asset.object_path, 300);
  if (signedError || !signed?.signedUrl) return NextResponse.json({ error: "Media unavailable" }, { status: 502 });

  const range = request.headers.get("range");
  const upstream = await fetch(signed.signedUrl, {
    cache: "no-store",
    headers: range ? { range } : undefined,
    signal: request.signal,
  });
  if (!upstream.ok && upstream.status !== 206) {
    return NextResponse.json({ error: "Media unavailable" }, { status: upstream.status === 404 ? 404 : 502 });
  }

  const headers = new Headers();
  for (const name of FORWARDED_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (!headers.has("content-type") && asset.mime_type) headers.set("content-type", asset.mime_type);
  headers.set("cache-control", "private, max-age=300");
  headers.set("vary", "Range, Cookie");
  headers.set("x-content-type-options", "nosniff");

  return new NextResponse(headOnly ? null : upstream.body, { status: upstream.status, headers });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ assetId: string }> }) {
  return streamMemberMedia(request, (await params).assetId);
}

export async function HEAD(request: NextRequest, { params }: { params: Promise<{ assetId: string }> }) {
  return streamMemberMedia(request, (await params).assetId, true);
}
