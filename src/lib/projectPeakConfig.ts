export type ProgramKey = string;

export type ProgramDuration = {
  label: string;
  months: number;
  price: number;
  note: string;
  currency?: string;
  badge?: string;
  originalPrice?: number;
  promoEnabled?: boolean;
  promoPrice?: number;
  promoLimit?: number;
  promoTitle?: string;
  promoDescription?: string;
};

export type ProjectProgram = {
  key: ProgramKey;
  name: string;
  shortName: string;
  headline: string;
  description: string;
  bestFor: string;
  image: string;
  accent: string;
  durations: ProgramDuration[];
  includes: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  outcomes: string[];
  process: string[];
  intakeFields: IntakeField[];
  feedbackFormType: FeedbackFormType;
};

export type IntakeFieldType = "text" | "number" | "photo";
export type FeedbackFormType = "weekly" | "end_of_program";

export type IntakeField = {
  id: string;
  label: string;
  type: IntakeFieldType;
  required: boolean;
  unit?: string;
  photoSlot?: "front" | "back" | "side" | "progress";
  prompt?: string;
};

export type TrackerField = {
  id: string;
  label: string;
  type: "number" | "time" | "select" | "checkbox" | "counter" | "text" | "photo";
  icon: string;
  fixed?: boolean;
  options?: string[];
};

export type TrackerSection = {
  title: "Morning" | "Mid-day" | "Night";
  icon: string;
  fields: TrackerField[];
};

export function defaultIntakeFields(): IntakeField[] {
  return [
    { id: "weight", label: "Weight", type: "number", required: true, unit: "kg", prompt: "လက်ရှိ ကိုယ်အလေးချိန် ဘယ်လောက်ရှိပါသလဲ?" },
    { id: "height", label: "Height", type: "text", required: true, prompt: "အရပ်ဘယ်လောက်ရှိပါသလဲ?" },
    { id: "age", label: "Age", type: "number", required: true, unit: "years", prompt: "အသက်ဘယ်လောက်ရှိပါသလဲ?" },
    { id: "photo_front", label: "Front body photo", type: "photo", required: true, photoSlot: "front", prompt: "ရှေ့ဘက် body photo ပို့ပေးပါ။" },
    { id: "photo_back", label: "Back body photo", type: "photo", required: true, photoSlot: "back", prompt: "နောက်ဘက် body photo ပို့ပေးပါ။" },
    { id: "photo_side", label: "Side body photo", type: "photo", required: true, photoSlot: "side", prompt: "ဘေးဘက် body photo ပို့ပေးပါ။" },
  ];
}

export function normalizeIntakeFields(value: unknown): IntakeField[] {
  if (!Array.isArray(value)) return defaultIntakeFields();
  const fields = value
    .map((item, index) => {
      if (typeof item === "string") {
        const label = item.trim();
        if (!label) return null;
        const lower = label.toLowerCase();
        const type: IntakeFieldType = lower.includes("photo") || lower.includes("ပုံ") ? "photo" : lower.includes("age") || lower.includes("weight") ? "number" : "text";
        return {
          id: label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || `field_${index + 1}`,
          label,
          type,
          required: true,
          prompt: label,
        };
      }
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const label = String(row.label || "").trim();
      if (!label) return null;
      const rawType = String(row.type || "text");
      const type: IntakeFieldType = rawType === "number" || rawType === "photo" ? rawType : "text";
      return {
        id: String(row.id || label.toLowerCase().replace(/[^a-z0-9]+/g, "_") || `field_${index + 1}`),
        label,
        type,
        required: row.required !== false,
        unit: row.unit ? String(row.unit) : undefined,
        photoSlot: row.photoSlot === "front" || row.photoSlot === "back" || row.photoSlot === "side" || row.photoSlot === "progress" ? row.photoSlot : undefined,
        prompt: row.prompt ? String(row.prompt) : label,
      };
    })
    .filter(Boolean) as IntakeField[];
  return fields.length ? fields : defaultIntakeFields();
}

export const paymentMethods = [
  {
    id: "kpay",
    label: "KBZPay",
    logo: "/payment-kpay-logo-01.png",
    qr: "/payment-kpay-qr-01.jpeg",
  },
  {
    id: "wavepay",
    label: "WavePay",
    logo: "/payment-wavepay-logo-01.png",
    qr: "/payment-wavepay-qr-01.jpg",
  },
  {
    id: "uabpay",
    label: "UAB Pay",
    logo: "/payment-uabpay-logo-01.jpg",
    qr: "/payment-uabpay-qr-01.jpg",
  },
];

export const defaultTrackerTemplate: TrackerSection[] = [
  {
    title: "Morning",
    icon: "ph-sun",
    fields: [
      { id: "weight", label: "Weight", type: "counter", icon: "ph-scales", fixed: true },
      { id: "up_at", label: "Up at", type: "time", icon: "ph-clock", fixed: true },
      { id: "sleep", label: "Sleep", type: "select", icon: "ph-moon", fixed: true, options: ["Poor", "Light", "OK", "Deep"] },
      { id: "first_win", label: "First win", type: "checkbox", icon: "ph-drop", fixed: true },
    ],
  },
  {
    title: "Mid-day",
    icon: "ph-mountains",
    fields: [
      { id: "workout", label: "Upper - Push", type: "checkbox", icon: "ph-barbell" },
      { id: "meal_1", label: "Meal 1", type: "checkbox", icon: "ph-check" },
      { id: "meal_2", label: "Meal 2", type: "photo", icon: "ph-camera" },
      { id: "meal_3", label: "Meal 3", type: "photo", icon: "ph-camera" },
      { id: "meal_4", label: "Meal 4", type: "photo", icon: "ph-camera" },
    ],
  },
  {
    title: "Night",
    icon: "ph-moon",
    fields: [
      { id: "steps", label: "Steps", type: "number", icon: "ph-person-simple-walk", fixed: true },
      { id: "phone_off", label: "Phone off", type: "time", icon: "ph-device-mobile-slash", fixed: true },
      { id: "water", label: "Water", type: "counter", icon: "ph-drop", fixed: true },
      { id: "omega_3", label: "Omega 3", type: "checkbox", icon: "ph-pill", fixed: true },
      { id: "one_win", label: "One win", type: "text", icon: "ph-trend-up", fixed: true },
      { id: "one_struggle", label: "One struggle", type: "text", icon: "ph-trend-down", fixed: true },
    ],
  },
];

export const feedbackTemplates = [
  {
    name: "Weekly Check-in",
    cadence: "Weekly",
    status: "Ready",
    fields: ["Average weight", "Progress photo", "Energy", "Motivation", "One struggle", "Needed changes"],
  },
  {
    name: "End Program Review",
    cadence: "End",
    status: "Draft",
    fields: ["Final photos", "Best result", "Hardest part", "Testimonial", "Next goal"],
  },
];

export const adminDevicePolicy = {
  maxDevices: 2,
  resetBy: "Admin or logged-in user",
  reason: "Prevent one paid account from being shared across many devices.",
};

export function formatMmk(value: number) {
  return new Intl.NumberFormat("en-US").format(value) + " MMK";
}

export function formatProgramPrice(value: number, currency = "MMK") {
  const amount = new Intl.NumberFormat("en-US").format(value || 0);
  const cleanCurrency = String(currency || "MMK").trim();
  if (cleanCurrency === "JPY" || cleanCurrency === "¥") return `¥${amount}`;
  if (cleanCurrency === "USD" || cleanCurrency === "$") return `$${amount}`;
  if (cleanCurrency === "THB" || cleanCurrency === "฿") return `฿${amount}`;
  return `${amount} ${cleanCurrency}`;
}
