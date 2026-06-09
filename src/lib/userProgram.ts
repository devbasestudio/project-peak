export async function saveUserProgram(supabase: any, row: Record<string, unknown>) {
  const { data: existing, error: lookupError } = await supabase
    .from("programs")
    .select("id")
    .eq("user_id", row.user_id)
    .limit(1)
    .maybeSingle();

  if (lookupError) throw lookupError;

  if (existing?.id) {
    const { error } = await supabase.from("programs").update(row).eq("id", existing.id);
    if (error) throw error;
    return { id: existing.id, action: "updated" };
  }

  const { data, error } = await supabase.from("programs").insert(row).select("id").maybeSingle();
  if (error) throw error;
  return { id: data?.id || null, action: "inserted" };
}
