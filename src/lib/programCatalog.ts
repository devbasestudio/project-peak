import { unstable_noStore as noStore } from "next/cache";
import {
  defaultIntakeFields,
  normalizeIntakeFields,
  type FeedbackFormType,
  type ProgramDuration,
  type ProjectProgram,
} from "@/lib/projectPeakConfig";
import { createAdminClient } from "@/utils/supabase/admin";

type ProgramCatalogRow = {
  program_key: string;
  name?: string | null;
  description?: string | null;
  image_url?: string | null;
  accent?: string | null;
  durations?: unknown;
  intake_fields?: unknown;
  feedback_form_type?: string | null;
  active?: boolean | null;
};

let cachedPrograms: { value: ProjectProgram[]; expiresAt: number } | null = null;
const PROGRAM_CACHE_MS = 5 * 60_000;

function validDurations(value: unknown): ProgramDuration[] | null {
  if (!Array.isArray(value)) return null;
  const durations = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const months = Number(row.months);
      const price = Number(row.price);
      if (!Number.isFinite(months) || !Number.isFinite(price)) return null;
      return {
        label: String(row.label || `${months} month${months > 1 ? "s" : ""}`),
        months,
        price,
        note: String(row.note || ""),
        currency: String(row.currency || "MMK"),
        badge: String(row.badge || ""),
        originalPrice: Number(row.originalPrice || 0) || undefined,
        promoEnabled: Boolean(row.promoEnabled),
        promoPrice: Number(row.promoPrice || 0) || undefined,
        promoLimit: Number(row.promoLimit || 0) || undefined,
        promoTitle: String(row.promoTitle || ""),
        promoDescription: String(row.promoDescription || ""),
      };
    })
    .filter(Boolean) as ProgramDuration[];

  return durations.length ? durations : null;
}

function shortNameFromName(name: string) {
  return name.replace(/\s+Program$/i, "").trim() || name;
}

export function programFromCatalogRow(row: ProgramCatalogRow): ProjectProgram {
  const name = String(row.name || row.program_key || "Untitled program").trim();
  const description = String(row.description || "").trim();
  const feedbackFormType: FeedbackFormType =
    row.feedback_form_type === "end_of_program" ? "end_of_program" : "weekly";

  return {
    key: String(row.program_key || "").trim(),
    name,
    shortName: shortNameFromName(name),
    headline: description || name,
    description,
    bestFor: description,
    image: row.image_url || "/img/hero_bg.jpg",
    accent: row.accent || "#ff6b35",
    durations: validDurations(row.durations) || [],
    includes: [],
    outcomes: [],
    process: [],
    intakeFields: normalizeIntakeFields(row.intake_fields || defaultIntakeFields()),
    feedbackFormType,
  };
}

export function mergeProgramCatalogRows(rows: ProgramCatalogRow[] = []) {
  return rows
    .filter((row) => row.active !== false && row.program_key)
    .map(programFromCatalogRow);
}

export const mergeOnlyProgramCatalogRows = mergeProgramCatalogRows;

export async function getPublicProjectPrograms(options: { fresh?: boolean } = {}): Promise<ProjectProgram[]> {
  if (options.fresh) noStore();
  if (!options.fresh && cachedPrograms && cachedPrograms.expiresAt > Date.now()) {
    return cachedPrograms.value;
  }
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("program_catalog")
      .select("program_key, name, description, image_url, accent, durations, intake_fields, feedback_form_type, active")
      .eq("active", true);

    if (error) return [];
    const rows = (data || []) as ProgramCatalogRow[];
    const programs = mergeProgramCatalogRows(rows);
    if (!options.fresh) {
      cachedPrograms = { value: programs, expiresAt: Date.now() + PROGRAM_CACHE_MS };
    }
    return programs;
  } catch {
    return [];
  }
}

export async function getPublicProjectProgram(key: string | undefined): Promise<ProjectProgram | null> {
  const programs = await getPublicProjectPrograms();
  return programs.find((program) => program.key === key) || null;
}
