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
  description: string;
  image: string;
  accent: string;
  durations: ProgramDuration[];
  intakeFields: string[];
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
    description:
      "Fat loss နဲ့ muscle gain ကို တပြိုင်နက်တည်း build လုပ်ချင်တဲ့ client တွေအတွက် habit, nutrition, training tracker ပါတဲ့ program.",
    image: "/user/Skinnyfat.jpg",
    accent: "#7eb6ff",
    durations: [
      { label: "1 month", months: 1, price: 50000, note: "Starter reset" },
      { label: "3 months", months: 3, price: 135000, note: "Most common" },
      { label: "6 months", months: 6, price: 250000, note: "Deep coaching" },
    ],
    intakeFields: ["Name", "Weight", "Height", "Age", "Front photo", "Back photo", "Side photo"],
  },
  {
    key: "project20",
    name: "Project-20 Program",
    shortName: "Project 20",
    description:
      "Weight loss ကို aggressive ဖြစ်ပေမယ့် sustainable ဖြစ်အောင် daily adherence နဲ့ weekly feedback ပေါင်းထားတဲ့ plan.",
    image: "/user/project 20.jpg",
    accent: "#f5b84b",
    durations: [
      { label: "1 month", months: 1, price: 55000, note: "Kickstart" },
      { label: "3 months", months: 3, price: 150000, note: "Best result window" },
      { label: "6 months", months: 6, price: 280000, note: "Long cut" },
    ],
    intakeFields: ["Name", "Weight", "Height", "Age", "Progress photos", "Weekly feedback"],
  },
  {
    key: "mass",
    name: "Mass Method Program",
    shortName: "Mass Method",
    description:
      "Hardgainer clients တွေအတွက် calorie surplus, progressive overload, recovery habit တွေကို compact tracker နဲ့ထိန်းတဲ့ program.",
    image: "/user/mass method.jpg",
    accent: "#8bd67a",
    durations: [
      { label: "1 month", months: 1, price: 60000, note: "Technique base" },
      { label: "3 months", months: 3, price: 165000, note: "Hypertrophy block" },
      { label: "6 months", months: 6, price: 310000, note: "Full bulk" },
    ],
    intakeFields: ["Name", "Weight", "Height", "Age", "Body photos", "End feedback"],
  },
];

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
