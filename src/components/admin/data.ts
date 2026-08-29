import { createClient } from "@/lib/supabase/server";
import { adminBlockTypes, type AdminBlockType, type AdminTemplate, type LocalizedBlockContent } from "./types";

function content(value: unknown): LocalizedBlockContent {
  return value && typeof value === "object" && !Array.isArray(value) ? value as LocalizedBlockContent : {};
}

function config(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function blockType(value: string): AdminBlockType {
  return adminBlockTypes.includes(value as AdminBlockType) ? value as AdminBlockType : "rich_text";
}

export async function getAdminOverview() {
  const supabase = await createClient();
  const [customers, activePrograms, pendingPayments, templates, recentOrders] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("programs").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("payment_orders").select("id", { count: "exact", head: true }).in("status", ["awaiting_payment", "submitted"]),
    supabase.from("program_templates").select("id", { count: "exact", head: true }),
    supabase.from("payment_orders").select("id,user_id,reference_code,status,amount_minor,currency,created_at").order("created_at", { ascending: false }).limit(6),
  ]);
  const firstError = [customers.error, activePrograms.error, pendingPayments.error, templates.error, recentOrders.error].find(Boolean);
  if (firstError) throw firstError;
  const userIds = [...new Set((recentOrders.data ?? []).map((order) => order.user_id))];
  const { data: profiles } = userIds.length ? await supabase.from("profiles").select("id,display_name").in("id", userIds) : { data: [] };
  const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name]));
  return {
    stats: { customers: customers.count ?? 0, activePrograms: activePrograms.count ?? 0, pendingPayments: pendingPayments.count ?? 0, templates: templates.count ?? 0 },
    recentOrders: (recentOrders.data ?? []).map((order) => ({ ...order, customerName: names.get(order.user_id) || "Unnamed customer" })),
  };
}

export async function getAdminCustomers() {
  const supabase = await createClient();
  const [profiles, programs, orders] = await Promise.all([
    supabase.from("profiles").select("id,display_name,preferred_locale,created_at").order("created_at", { ascending: false }).limit(1000),
    supabase.from("programs").select("id,user_id,status,name_mm,name_en,assigned_at").order("assigned_at", { ascending: false }).limit(1000),
    supabase.from("payment_orders").select("id,user_id,status,reference_code,created_at").order("created_at", { ascending: false }).limit(1000),
  ]);
  const firstError = [profiles.error, programs.error, orders.error].find(Boolean);
  if (firstError) throw firstError;
  return (profiles.data ?? []).map((profile) => ({
    ...profile,
    program: (programs.data ?? []).find((program) => program.user_id === profile.id) ?? null,
    order: (orders.data ?? []).find((order) => order.user_id === profile.id) ?? null,
  }));
}

export async function getAdminPayments() {
  const supabase = await createClient();
  const [orders, profiles, versions, templates] = await Promise.all([
    supabase.from("payment_orders").select("id,user_id,reference_code,status,amount_minor,currency,customer_note,submitted_at,approved_at,created_at").order("created_at", { ascending: false }).limit(500),
    supabase.from("profiles").select("id,display_name").limit(1000),
    supabase.from("template_versions").select("id,template_id,version_no,name_en,status").eq("status", "published").order("version_no", { ascending: false }),
    supabase.from("program_templates").select("id,name_en"),
  ]);
  const firstError = [orders.error, profiles.error, versions.error, templates.error].find(Boolean);
  if (firstError) throw firstError;
  const names = new Map((profiles.data ?? []).map((profile) => [profile.id, profile.display_name]));
  const templateNames = new Map((templates.data ?? []).map((template) => [template.id, template.name_en]));
  return {
    orders: (orders.data ?? []).map((order) => ({ ...order, customerName: names.get(order.user_id) || "Unnamed customer" })),
    versions: (versions.data ?? []).map((version) => ({ id: version.id, label: `${version.name_en || templateNames.get(version.template_id) || "Program"} · v${version.version_no}` })),
  };
}

export async function getAdminTemplates() {
  const supabase = await createClient();
  const [templates, versions, documents] = await Promise.all([
    supabase.from("program_templates").select("id,slug,name_mm,name_en,description_mm,description_en,created_at,updated_at").order("updated_at", { ascending: false }),
    supabase.from("template_versions").select("id,template_id,version_no,status,published_at,updated_at").order("version_no", { ascending: false }),
    supabase.from("template_documents").select("id,template_version_id"),
  ]);
  const firstError = [templates.error, versions.error, documents.error].find(Boolean);
  if (firstError) throw firstError;
  return (templates.data ?? []).map((template) => {
    const latest = (versions.data ?? []).find((version) => version.template_id === template.id) ?? null;
    const documentCount = latest ? (documents.data ?? []).filter((document) => document.template_version_id === latest.id).length : 0;
    return { ...template, latest, documentCount };
  });
}

export async function getAdminTemplate(templateId: string): Promise<AdminTemplate | null> {
  const supabase = await createClient();
  const [{ data: template, error: templateError }, { data: versions, error: versionsError }] = await Promise.all([
    supabase.from("program_templates").select("id,slug,name_mm,name_en,description_mm,description_en").eq("id", templateId).maybeSingle(),
    supabase.from("template_versions").select("id,template_id,version_no,status").eq("template_id", templateId).order("version_no", { ascending: false }),
  ]);
  if (templateError || versionsError) throw templateError || versionsError;
  if (!template) return null;
  const version = (versions ?? []).find((item) => item.status === "draft") ?? (versions ?? []).find((item) => item.status === "published") ?? versions?.[0];
  if (!version) return null;

  const { data: documents, error: documentError } = await supabase
    .from("template_documents")
    .select("id,screen_key,day_number,title_mm,title_en,position")
    .eq("template_version_id", version.id)
    .order("position");
  if (documentError) throw documentError;
  const documentIds = (documents ?? []).map((document) => document.id);
  const blocksResult = documentIds.length
    ? await supabase.from("template_blocks").select("id,document_id,position,block_type,title_mm,title_en,content_mm,content_en,config,visible").in("document_id", documentIds).order("position")
    : { data: [], error: null };
  if (blocksResult.error) throw blocksResult.error;

  return {
    id: template.id,
    slug: template.slug,
    nameMm: template.name_mm,
    nameEn: template.name_en,
    descriptionMm: template.description_mm ?? "",
    descriptionEn: template.description_en ?? "",
    versionId: version.id,
    versionStatus: version.status as AdminTemplate["versionStatus"],
    versionNo: version.version_no,
    documents: (documents ?? []).map((document) => ({
      id: document.id,
      screenKey: document.screen_key,
      dayNumber: document.day_number,
      titleMm: document.title_mm,
      titleEn: document.title_en,
      blocks: (blocksResult.data ?? []).filter((block) => block.document_id === document.id).map((block) => ({
        id: block.id,
        blockType: blockType(block.block_type),
        titleMm: block.title_mm ?? "",
        titleEn: block.title_en ?? "",
        contentMm: content(block.content_mm),
        contentEn: content(block.content_en),
        config: config(block.config),
        visible: block.visible !== false,
      })),
    })),
  };
}

