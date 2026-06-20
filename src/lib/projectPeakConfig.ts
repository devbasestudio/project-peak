export type ProgramKey = "recomp" | "project20" | "mass";

export type ProgramDuration = {
  label: string;
  months: number;
  price: number;
  note: string;
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
  type: "number" | "time" | "select" | "checkbox" | "counter" | "text";
  icon: string;
  fixed?: boolean;
  options?: string[];
};

export type TrackerSection = {
  title: "Morning" | "Mid-day" | "Night";
  icon: string;
  fields: TrackerField[];
};

export const projectPrograms: ProjectProgram[] = [
  {
    key: "recomp",
    name: "Skinnyfat Recomp Program",
    shortName: "Recomp",
    headline: "Soft body ကနေ lean defined shape ဆီသွားမယ်",
    description:
      "Fat loss နဲ့ muscle gain ကို တပြိုင်နက်တည်း build လုပ်ချင်တဲ့ client တွေအတွက် habit, nutrition, training tracker ပါတဲ့ program.",
    bestFor: "Weight ကအရမ်းမများပေမယ့် belly fat, weak muscle tone, shape မထွက်သေးတဲ့သူတွေ",
    image: "/user/Skinnyfat.jpg",
    accent: "#7eb6ff",
    durations: [
      { label: "1 month", months: 1, price: 50000, note: "Starter reset" },
      { label: "3 months", months: 3, price: 135000, note: "Most common" },
      { label: "6 months", months: 6, price: 250000, note: "Deep coaching" },
    ],
    includes: [
      { icon: "ph-barbell", title: "Customized Workout", description: "အပတ်စဉ် overload တက်သွားအောင် admin က split နဲ့ volume ကိုချိန်ပေးမယ်။" },
      { icon: "ph-bowl-food", title: "Macro Guide", description: "Protein target, meal timing, calorie range တွေကို daily tracker နဲ့လိုက်ကြည့်မယ်။" },
      { icon: "ph-chart-line-up", title: "Daily Tracker", description: "Weight, sleep, water, meals, steps, win/struggle notes တွေကို compact dashboard မှာမှတ်မယ်။" },
      { icon: "ph-chat-circle-text", title: "Weekly Feedback", description: "Progress photo, average weight, energy feedback ပေါ်မူတည်ပြီး plan adjust လုပ်မယ်။" },
    ],
    outcomes: ["Body shape ပိုတင်းလာခြင်း", "Belly fat လျော့ပြီး muscle tone တက်ခြင်း", "Training consistency တည်ဆောက်ခြင်း"],
    process: ["Payment submit", "Admin approval", "Custom tracker setup", "Daily logging + weekly feedback"],
    intakeFields: defaultIntakeFields(),
    feedbackFormType: "weekly",
  },
  {
    key: "project20",
    name: "Project-20 Program",
    shortName: "Project 20",
    headline: "Fat loss ကို structured system နဲ့ချမယ်",
    description:
      "Weight loss ကို aggressive ဖြစ်ပေမယ့် sustainable ဖြစ်အောင် daily adherence နဲ့ weekly feedback ပေါင်းထားတဲ့ plan.",
    bestFor: "Weight လျှော့ချင်ပြီး diet ပြတ်တောက်လွယ်တာကို tracker နဲ့ထိန်းချင်တဲ့သူတွေ",
    image: "/user/project 20.jpg",
    accent: "#f5b84b",
    durations: [
      { label: "1 month", months: 1, price: 55000, note: "Kickstart" },
      { label: "3 months", months: 3, price: 150000, note: "Best result window" },
      { label: "6 months", months: 6, price: 280000, note: "Long cut" },
    ],
    includes: [
      { icon: "ph-fire", title: "Fat-loss Strategy", description: "Calorie deficit ကို performance မကျအောင် strength/cardio mix နဲ့တည်ဆောက်မယ်။" },
      { icon: "ph-fork-knife", title: "Meal Adherence", description: "Meal completion, protein, calories ကိုအလွယ်တကူ check လုပ်နိုင်မယ်။" },
      { icon: "ph-camera", title: "Progress Photos", description: "Weekly photos နဲ့ measurement trend တွေကို admin ကပြန်ကြည့်ပေးမယ်။" },
      { icon: "ph-target", title: "Weekly Adjustment", description: "Plateau ဖြစ်လာရင် steps, calories, cardio volume ကိုပြန်ချိန်မယ်။" },
    ],
    outcomes: ["Weight trend လျော့လာခြင်း", "Meal consistency တိုးလာခြင်း", "Energy မကျဘဲ cut လုပ်နိုင်ခြင်း"],
    process: ["Choose duration", "Upload payment proof", "Admin builds deficit plan", "Track meals + weekly check-in"],
    intakeFields: defaultIntakeFields(),
    feedbackFormType: "weekly",
  },
  {
    key: "mass",
    name: "Mass Method Program",
    shortName: "Mass Method",
    headline: "Hardgainer တွေအတွက် muscle gain system",
    description:
      "Hardgainer clients တွေအတွက် calorie surplus, progressive overload, recovery habit တွေကို compact tracker နဲ့ထိန်းတဲ့ program.",
    bestFor: "Weight တက်ခက်၊ muscle တက်ချင်ပြီး food/training consistency လိုတဲ့သူတွေ",
    image: "/user/mass method.jpg",
    accent: "#8bd67a",
    durations: [
      { label: "1 month", months: 1, price: 60000, note: "Technique base" },
      { label: "3 months", months: 3, price: 165000, note: "Hypertrophy block" },
      { label: "6 months", months: 6, price: 310000, note: "Full bulk" },
    ],
    includes: [
      { icon: "ph-barbell", title: "Hypertrophy Plan", description: "Compound lifts နဲ့ accessory work ကို volume တိုးသွားအောင်စီစဉ်မယ်။" },
      { icon: "ph-bowl-steam", title: "Surplus Nutrition", description: "Calorie surplus ကိုအလွန်အကျွံ fat မတက်အောင် controlled range နဲ့လုပ်မယ်။" },
      { icon: "ph-moon", title: "Recovery Tracking", description: "Sleep, water, phone-off, steps ကို recovery quality အတွက်လိုက်ကြည့်မယ်။" },
      { icon: "ph-chart-bar", title: "Strength Progress", description: "Workout log နဲ့ weight trend ပေါ်မူတည်ပြီး sets/reps တိုးသွားမယ်။" },
    ],
    outcomes: ["Muscle size တိုးလာခြင်း", "Strength progression မြင်ရခြင်း", "Food habit တည်ဆောက်နိုင်ခြင်း"],
    process: ["Select package", "Submit intake photos", "Admin sets bulk tracker", "Daily log + progressive workouts"],
    intakeFields: defaultIntakeFields(),
    feedbackFormType: "end_of_program",
  },
];

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

export function getProjectProgram(key: string | undefined) {
  return projectPrograms.find((program) => program.key === key) || projectPrograms[0];
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
      { id: "meal_2", label: "Meal 2", type: "checkbox", icon: "ph-camera" },
      { id: "meal_3", label: "Meal 3", type: "checkbox", icon: "ph-camera" },
      { id: "meal_4", label: "Meal 4", type: "checkbox", icon: "ph-camera" },
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
