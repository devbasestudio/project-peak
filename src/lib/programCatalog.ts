import {
  normalizeIntakeFields,
  projectPrograms,
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
      };
    })
    .filter(Boolean) as ProgramDuration[];

  return durations.length ? durations : null;
}

export function mergeProgramCatalogRows(rows: ProgramCatalogRow[] = []) {
  const byKey = new Map(rows.map((row) => [row.program_key, row]));

  return projectPrograms.map((program) => {
    const row = byKey.get(program.key);
    if (!row || row.active === false) return program;

    return {
      ...program,
      name: row.name || program.name,
      description: row.description || program.description,
      image: row.image_url || program.image,
      accent: row.accent || program.accent,
      durations: validDurations(row.durations) || program.durations,
      intakeFields: normalizeIntakeFields(row.intake_fields || program.intakeFields),
      feedbackFormType:
        row.feedback_form_type === "end_of_program" || row.feedback_form_type === "weekly"
          ? (row.feedback_form_type as FeedbackFormType)
          : program.feedbackFormType,
    };
  });
}

export async function getPublicProjectPrograms(): Promise<ProjectProgram[]> {
  if (cachedPrograms && cachedPrograms.expiresAt > Date.now()) {
    return cachedPrograms.value;
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("program_catalog")
      .select("program_key, name, description, image_url, accent, durations, intake_fields, feedback_form_type, active")
      .eq("active", true);

    if (error) return projectPrograms;
    const programs = mergeProgramCatalogRows((data || []) as ProgramCatalogRow[]);
    cachedPrograms = { value: programs, expiresAt: Date.now() + PROGRAM_CACHE_MS };
    return programs;
  } catch {
    return projectPrograms;
  }
}

export async function getPublicProjectProgram(key: string | undefined): Promise<ProjectProgram> {
  const programs = await getPublicProjectPrograms();
  return programs.find((program) => program.key === key) || programs[0];
}
