import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import {
  appBaseUrl,
  ensureTelegramUserAccount,
  isAdminTelegramId,
  normalizeTelegramLoginId,
} from "@/lib/adminAuth";
import { approvePaymentRegistration, rejectPaymentRegistration } from "@/lib/paymentReview";
import { getPublicProjectPrograms } from "@/lib/programCatalog";
import {
  defaultIntakeFields,
  formatMmk,
  paymentMethods,
  type IntakeField,
  type ProjectProgram,
} from "@/lib/projectPeakConfig";
import {
  answerCallbackQuery,
  getTelegramFileUrl,
  getTelegramRuntimeStatus,
  notifyAdminsPayment,
  sendTelegramMessage,
  setTelegramChatMenuButton,
  type TelegramInlineButton,
} from "@/lib/telegram";
import { createAdminClient } from "@/utils/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TelegramUser = {
  id?: number | string;
  username?: string;
  first_name?: string;
  last_name?: string;
};

type TelegramMessage = {
  message_id?: number;
  text?: string;
  photo?: Array<{ file_id: string; file_size?: number; width?: number; height?: number }>;
  document?: { file_id?: string; mime_type?: string; file_name?: string };
  chat?: { id?: number | string };
  from?: TelegramUser;
};

type TelegramCallbackQuery = {
  id: string;
  data?: string;
  from?: TelegramUser;
  message?: TelegramMessage;
};

function userDisplayName(from?: TelegramUser) {
  return [from?.first_name, from?.last_name].filter(Boolean).join(" ").trim()
    || from?.username
    || (from?.id ? `Telegram ${from.id}` : "Telegram user");
}

function signLaunchParams(telegramId: string, timestamp: string) {
  const secret = process.env.TELEGRAM_BOT_TOKEN || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!secret) return "";
  return createHmac("sha256", secret)
    .update(`${telegramId}:${timestamp}`)
    .digest("hex");
}

function miniAppUrl(baseUrl: string, from?: TelegramUser) {
  const appUrl = `${baseUrl}/miniapp`;
  if (!from?.id) return appUrl;
  const telegramId = String(from.id);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const params = new URLSearchParams({
    tg_id: telegramId,
    tg_ts: timestamp,
    tg_sig: signLaunchParams(telegramId, timestamp),
    ...(from.username ? { tg_username: String(from.username) } : {}),
    ...(userDisplayName(from) ? { tg_name: userDisplayName(from) } : {}),
  });
  return `${appUrl}?${params.toString()}`;
}

function assetUrl(baseUrl: string, path: string) {
  if (!path) return `${baseUrl}/img/hero_bg.jpg`;
  if (/^https?:\/\//i.test(path)) return path;
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function escapeHtml(value: string | number | undefined | null) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function telegramCaption(lines: string[]) {
  const caption = lines.join("\n");
  return caption.length > 1000 ? `${caption.slice(0, 997)}...` : caption;
}

function durationDisplayLabel(duration: ProjectProgram["durations"][number]) {
  return String(duration.label || "").trim() || durationLabel(duration.months);
}

function durationButtonText(duration: ProjectProgram["durations"][number]) {
  const note = String(duration.note || "").trim().replace(/\s+/g, " ");
  const text = `${durationDisplayLabel(duration)} | ${formatMmk(duration.price)}${note ? ` · ${note}` : ""}`;
  return text.length > 62 ? `${text.slice(0, 59)}...` : text;
}

function durationRows(program: ProjectProgram): TelegramInlineButton[][] {
  const rows = program.durations.map((duration) => [
    {
      text: durationButtonText(duration),
      callback_data: `buy:${program.key}:${duration.months}`,
    },
  ]);
  rows.push([{ text: "Package အားလုံး ပြန်ကြည့်မယ်", callback_data: "buy" }]);
  return rows;
}

function packageRows(programs: ProjectProgram[]): TelegramInlineButton[][] {
  return programs.map((program) => [
    {
      text: `${program.shortName} ကြည့်မယ်`,
      callback_data: `pkg:${program.key}`,
    },
  ]);
}

function mainMenuRows(appUrl: string): TelegramInlineButton[][] {
  return [
    [{ text: "Package တွေကြည့်မယ်", callback_data: "buy" }],
    [{ text: "Payment အခြေအနေစစ်မယ်", callback_data: "check_payment" }],
    [{ text: "Mini App ဖွင့်မယ်", web_app: { url: appUrl } }],
  ];
}

function durationLabel(months: number) {
  return months === 1 ? "၁ လ" : `${months} လ`;
}

function paymentStatusLabel(status: string) {
  if (status === "awaiting_payment") return "ငွေလွှဲ screenshot စောင့်နေသည်";
  if (status === "pending") return "Admin စစ်နေသည်";
  if (status === "approved") return "Payment approve ဖြစ်ပြီး tracker ပြင်နေသည်";
  if (status === "ready") return "သုံးရန်အဆင်သင့်";
  if (status === "rejected") return "Screenshot ပြန်တင်ရန်လိုသည်";
  return status || "စစ်ဆေးနေသည်";
}

function packageSummary(programs: ProjectProgram[]) {
  const lines = programs.map((program, index) => {
    const startPrice = program.durations[0]?.price ? formatMmk(program.durations[0].price) : "";
    return `${index + 1}. <b>${escapeHtml(program.shortName)}</b>${startPrice ? ` - ${startPrice} မှစ` : ""}`;
  });

  return [
    "<b>Project Peak package တွေပါ</b>",
    "အရင်ဆုံး ကိုယ်စိတ်ဝင်စားတဲ့ package ကိုရွေးကြည့်ပါ။",
    "ရွေးပြီးမှ အသေးစိတ်၊ ပုံ၊ ဈေးနှုန်းနဲ့ ဝယ်လို့ရတဲ့ duration တွေကို သီးသန့်ပြပေးပါမယ်။",
    "",
    ...lines,
  ].join("\n");
}

function packageCaption(program: ProjectProgram) {
  const includes = program.includes.slice(0, 3).map((item) => `• ${escapeHtml(item.title)}`).join("\n");
  const prices = program.durations
    .map((duration) => {
      const note = String(duration.note || "").trim();
      return [
        `• <b>${escapeHtml(durationDisplayLabel(duration))}</b>: ${formatMmk(duration.price)}`,
        note ? `  <i>${escapeHtml(note)}</i>` : "",
      ].filter(Boolean).join("\n");
    })
    .join("\n");
  const lines = [
    `<b>${escapeHtml(program.name)}</b>`,
    program.description ? `<i>${escapeHtml(program.description)}</i>` : "",
    "",
    includes ? `<b>Package ထဲမှာပါတာတွေ</b>\n${includes}` : "",
    "",
    prices ? `<b>ဈေးနှုန်း</b>\n${prices}` : "ဈေးနှုန်း မထည့်ရသေးပါ။",
    "",
    prices
      ? "အဆင်ပြေရင် အောက်က duration ကိုနှိပ်ပါ။ Payment QR ကို ဒီ chat ထဲမှာပဲ ချက်ချင်းပို့ပေးပါမယ်။"
      : "Admin ဘက်က ဈေးနှုန်းထည့်ပြီး save လုပ်ပြီးမှ ဝယ်လို့ရပါမယ်။",
  ].filter((line) => line !== "");

  return telegramCaption(lines);
}

function paymentCaption(program: ProjectProgram, months: number, price: number, telegramId: string) {
  const paymentMethod = paymentMethods[0];
  return [
    "<b>Payment လုပ်ရန်အသေးစိတ်</b>",
    `Package: ${escapeHtml(program.name)}`,
    `Duration: ${durationLabel(months)}`,
    `ကျသင့်ငွေ: ${formatMmk(price)}`,
    `ငွေလွှဲမည့်နည်းလမ်း: ${escapeHtml(paymentMethod.label)}`,
    "",
    `သင့် Telegram ID: <code>${telegramId}</code>`,
    "",
    "ငွေလွှဲပြီးသွားရင် screenshot ကို ဒီ chat ထဲကို photo အနေနဲ့ပို့ပေးပါ။",
    "Admin စစ်ပြီး approve လုပ်ပြီးတာနဲ့ သင့်အတွက် tracker ကိုပြင်ပေးပါမယ်။ Ready ဖြစ်ရင် Mini App သုံးလို့ရပါပြီ။",
  ].join("\n");
}

function telegramMethodResponse(method: string, payload: Record<string, unknown>) {
  return NextResponse.json({ method, ...payload });
}

function telegramMessagePayload(chatId: string, text: string, rows?: TelegramInlineButton[][]) {
  return {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...(rows ? { reply_markup: { inline_keyboard: rows } } : {}),
  };
}

function sendMessageResponse(chatId: string, text: string, rows?: TelegramInlineButton[][]) {
  return telegramMethodResponse("sendMessage", telegramMessagePayload(chatId, text, rows));
}

function sendPhotoResponse(chatId: string, photoUrl: string, caption: string, rows?: TelegramInlineButton[][]) {
  return telegramMethodResponse("sendPhoto", {
    chat_id: chatId,
    photo: photoUrl,
    caption,
    parse_mode: "HTML",
    ...(rows ? { reply_markup: { inline_keyboard: rows } } : {}),
  });
}

async function withTimeout<T>(promise: Promise<T>, fallback: T, ms: number) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeoutId = setTimeout(() => resolve(fallback), ms);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function getFastProjectPrograms() {
  return withTimeout(getPublicProjectPrograms({ fresh: true }), [], 900);
}

function noPackagesResponse(chatId: string) {
  return sendMessageResponse(
    chatId,
    [
      "<b>Package မရှိသေးပါ</b>",
      "အခုလောလောဆယ် admin ဘက်က package တွေ မတင်ရသေးပါ။",
      "Package အသစ်တင်ပြီးမှ ဒီနေရာမှာ ပြန်ပေါ်လာပါမယ်။",
    ].join("\n"),
  );
}

function telegramImageFileType(fileUrl: string, headerContentType: string | null) {
  const header = String(headerContentType || "").toLowerCase();
  const pathname = (() => {
    try {
      return new URL(fileUrl).pathname.toLowerCase();
    } catch {
      return fileUrl.toLowerCase();
    }
  })();

  if (header.includes("image/png") || pathname.endsWith(".png")) {
    return { contentType: "image/png", ext: "png" };
  }
  if (header.includes("image/webp") || pathname.endsWith(".webp")) {
    return { contentType: "image/webp", ext: "webp" };
  }
  if (header.includes("image/heic") || pathname.endsWith(".heic")) {
    return { contentType: "image/heic", ext: "heic" };
  }
  if (header.includes("image/heif") || pathname.endsWith(".heif")) {
    return { contentType: "image/heif", ext: "heif" };
  }
  return { contentType: "image/jpeg", ext: "jpg" };
}

async function uploadTelegramFile(fileUrl: string, telegramId: string, prefix = "telegram_payment") {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error("Could not download Telegram payment screenshot.");
  }

  const { contentType, ext } = telegramImageFileType(fileUrl, response.headers.get("content-type"));
  const buffer = Buffer.from(await response.arrayBuffer());
  const filename = `${prefix}_${telegramId}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const supabase = createAdminClient();

  const { error } = await supabase.storage
    .from("registrations")
    .upload(filename, buffer, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Payment screenshot upload failed: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("registrations").getPublicUrl(filename);

  return publicUrl;
}

function normalizeIntakeAnswers(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as Record<string, any>) }
    : {};
}

function isAnswered(field: IntakeField, answers: Record<string, any>) {
  const answer = answers[field.id];
  if (!answer) return false;
  if (field.type === "photo") return Boolean(answer.fileUrl || answer.value);
  return String(answer.value ?? "").trim().length > 0;
}

function nextIntakeField(fields: IntakeField[], answers: Record<string, any>) {
  return fields.find((field) => !isAnswered(field, answers)) || null;
}

function photoColumnForField(field: IntakeField) {
  if (field.photoSlot === "front" || field.id.toLowerCase().includes("front")) return "photo_front";
  if (field.photoSlot === "back" || field.id.toLowerCase().includes("back")) return "photo_back";
  if (field.photoSlot === "side" || field.id.toLowerCase().includes("side")) return "photo_side";
  return "";
}

async function intakeFieldsForRegistration(registration: any) {
  const programs = await getFastProjectPrograms();
  const program = programs.find((item) => item.key === registration.program_key);
  return program?.intakeFields?.length ? program.intakeFields : defaultIntakeFields();
}

function intakeQuestionText(field: IntakeField, index: number, total: number) {
  const prompt = field.prompt || field.label;
  const inputHint =
    field.type === "photo"
      ? "ပုံကို photo အနေနဲ့ ဒီ chat ထဲကိုပို့ပေးပါ။"
      : field.type === "number"
        ? "နံပါတ်နဲ့ပဲ ဖြေပေးပါနော်။"
        : "စာနဲ့ဖြေပေးပါနော်။";

  return [
    `<b>Client info (${index + 1}/${total})</b>`,
    escapeHtml(prompt),
    "",
    inputHint,
  ].join("\n");
}

async function sendNextIntakeQuestion(chatId: string, registration: any) {
  const fields = await intakeFieldsForRegistration(registration);
  const answers = normalizeIntakeAnswers(registration.intake_answers);
  const field = nextIntakeField(fields, answers);
  if (!field) {
    await sendTelegramMessageQuietly(
      chatId,
      "<b>အချက်အလက်တွေ အကုန်ရပါပြီ</b>\nAdmin က payment နဲ့ info တွေကိုစစ်ပြီး tracker ပြင်ပေးပါမယ်။ Ready ဖြစ်တာနဲ့ ဒီ bot ကနေပြန်ပို့ပါမယ်နော်။",
    );
    return true;
  }

  const index = fields.findIndex((item) => item.id === field.id);
  await sendTelegramMessageQuietly(chatId, intakeQuestionText(field, index, fields.length));
  return false;
}

async function openIntakeRegistration(supabase: any, telegramId: string) {
  const { data, error } = await supabase
    .from("program_registrations")
    .select("id, telegram_id, program_key, program_name, payment_status, status, intake_answers")
    .eq("telegram_id", telegramId)
    .in("payment_status", ["pending", "approved"])
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) throw error;
  for (const registration of data || []) {
    const fields = await intakeFieldsForRegistration(registration);
    const answers = normalizeIntakeAnswers(registration.intake_answers);
    if (nextIntakeField(fields, answers)) return { registration, fields, answers };
  }
  return null;
}

async function handleIntakeReply(chatId: string, from: TelegramUser | undefined, message: TelegramMessage) {
  const telegramId = normalizeTelegramLoginId(String(from?.id || "")).replace(/^@/, "");
  if (!telegramId) return false;

  const supabase = createAdminClient();
  const active = await openIntakeRegistration(supabase, telegramId);
  if (!active) return false;

  const field = nextIntakeField(active.fields, active.answers);
  if (!field) return false;

  const text = String(message.text || "").trim();
  const nextAnswers = { ...active.answers };
  const answer: Record<string, unknown> = {
    label: field.label,
    type: field.type,
    answeredAt: new Date().toISOString(),
  };
  const patch: Record<string, unknown> = {};

  if (field.type === "photo") {
    const largestPhoto = message.photo?.slice().sort((a, b) => (b.file_size || 0) - (a.file_size || 0))[0];
    const imageDocument = message.document?.mime_type?.startsWith("image/") ? message.document : null;
    const fileId = largestPhoto?.file_id || imageDocument?.file_id || "";
    if (!fileId) {
      await sendTelegramMessageQuietly(chatId, "ဒီမေးခွန်းအတွက် ပုံတစ်ပုံ ပို့ပေးရမှာပါ။ Photo အနေနဲ့ပို့ပေးပါနော်။");
      return true;
    }
    const fileUrl = await getTelegramFileUrl(fileId);
    if (!fileUrl) throw new Error("Could not get Telegram file URL.");
    const uploadedUrl = await uploadTelegramFile(fileUrl, telegramId, `intake_${field.id}`);
    answer.fileUrl = uploadedUrl;
    answer.value = uploadedUrl;
    const photoColumn = photoColumnForField(field);
    if (photoColumn) patch[photoColumn] = uploadedUrl;
  } else {
    if (!text) {
      await sendTelegramMessageQuietly(chatId, "ဒီမေးခွန်းကို စာနဲ့ဖြေပေးပါနော်။");
      return true;
    }
    if (field.type === "number") {
      const numericValue = Number(text.replace(/,/g, ""));
      if (!Number.isFinite(numericValue)) {
        await sendTelegramMessageQuietly(chatId, "နံပါတ်အနေနဲ့ ပြန်ဖြေပေးပါနော်။ ဥပမာ 70");
        return true;
      }
      answer.value = numericValue;
      if (field.id.toLowerCase().includes("age")) patch.age = Math.round(numericValue);
      if (field.id.toLowerCase().includes("weight")) patch.weight = numericValue;
    } else {
      answer.value = text;
      if (field.id.toLowerCase().includes("height")) patch.height = text;
      if (field.id.toLowerCase().includes("phone")) patch.phone = text;
      if (field.id.toLowerCase().includes("email")) patch.email = text;
    }
  }

  nextAnswers[field.id] = answer;
  const { data: updatedRegistration, error } = await supabase
    .from("program_registrations")
    .update({ ...patch, intake_answers: nextAnswers })
    .eq("id", active.registration.id)
    .select("id, telegram_id, program_key, program_name, payment_status, status, intake_answers")
    .maybeSingle();

  if (error) throw error;
  await sendNextIntakeQuestion(chatId, updatedRegistration || { ...active.registration, intake_answers: nextAnswers });
  return true;
}

async function seedTelegramUser(from?: TelegramUser) {
  const telegramId = normalizeTelegramLoginId(String(from?.id || "")).replace(/^@/, "");
  if (!telegramId || isAdminTelegramId(telegramId)) return null;
  return ensureTelegramUserAccount({
    telegramId,
    username: from?.username ? String(from.username) : "",
    firstName: from?.first_name ? String(from.first_name) : "",
    lastName: from?.last_name ? String(from.last_name) : "",
  });
}

async function sendTelegramMessageQuietly(
  chatId: string,
  text: string,
  appUrl?: string,
  options?: { buttonText?: string; webApp?: boolean },
) {
  await sendTelegramMessage(chatId, text, appUrl, options).catch(() => null);
}

async function sendStartMenu(chatId: string, from: TelegramUser | undefined, baseUrl: string) {
  const telegramId = normalizeTelegramLoginId(String(from?.id || "")).replace(/^@/, "");
  const appUrl = miniAppUrl(baseUrl, from);
  void seedTelegramUser(from).catch(() => null);
  void setTelegramChatMenuButton(chatId, appUrl).catch(() => null);

  const text = [
    "<b>Project Peak မှကြိုဆိုပါတယ်</b>",
    telegramId ? `သင့် Telegram ID က <code>${telegramId}</code> ပါ။` : "",
    "",
    "ဒီ bot chat ထဲမှာ package ကြည့်တာ၊ package ဝယ်တာ၊ payment screenshot ပို့တာ အကုန်လုပ်နိုင်ပါတယ်။",
    "Payment approve ပြီး tracker ready ဖြစ်မှ Mini App ကိုဖွင့်သုံးလို့ရပါမယ်။",
    "",
    "စမယ်ဆိုရင် Package တွေကြည့်မယ် ကိုနှိပ်လိုက်ပါ။",
  ].filter(Boolean).join("\n");

  return sendMessageResponse(chatId, text, mainMenuRows(appUrl));
}

async function handlePackageMenu(chatId: string) {
  const programs = await getFastProjectPrograms();
  if (!programs.length) return noPackagesResponse(chatId);
  return sendMessageResponse(
    chatId,
    packageSummary(programs),
    packageRows(programs),
  );
}

async function handlePackageDetails(chatId: string, packageKey: string, baseUrl: string) {
  const programs = await getFastProjectPrograms();
  if (!programs.length) return noPackagesResponse(chatId);
  const program = programs.find((item) => item.key === packageKey);
  if (!program) return noPackagesResponse(chatId);
  return sendPhotoResponse(
    chatId,
    assetUrl(baseUrl, program.image),
    packageCaption(program),
    durationRows(program),
  );
}

function paymentStatusCopy(registration: any, appUrl: string): { text: string; rows?: TelegramInlineButton[][] } {
  if (!registration) {
    return {
      text: [
        "<b>Payment အခြေအနေ</b>",
        "အခုထိ package ရွေးထားတာ မတွေ့သေးပါ။ Package တွေကြည့်မယ် ကိုနှိပ်ပြီး ကိုယ်ကြိုက်တဲ့ duration ကိုရွေးပေးပါနော်။",
      ].join("\n"),
      rows: [[{ text: "Package တွေကြည့်မယ်", callback_data: "buy" }]],
    };
  }

  const paymentStatus = String(registration.payment_status || registration.status || "").toLowerCase();
  const rows: TelegramInlineButton[][] = [];
  let body = "";

  if (paymentStatus === "awaiting_payment") {
    body = "Payment screenshot မရသေးပါ။ QR နဲ့ငွေလွှဲပြီး screenshot ကို ဒီ chat ထဲကို photo အနေနဲ့ပို့ပေးပါ။";
  } else if (paymentStatus === "pending") {
    body = "Payment screenshot ရထားပါပြီ။ Admin ကစစ်နေပါတယ်။ စစ်ပြီးတာနဲ့ ဒီ bot ကနေပြန်ပို့ပေးပါမယ်။";
  } else if (paymentStatus === "approved") {
    body = "Payment approve ဖြစ်ပါပြီ။ Admin က သင့်အတွက် custom tracker ပြင်နေပါတယ်။ Ready ဖြစ်တာနဲ့ ဒီ bot ကနေပြန်ပို့ပါမယ်။";
  } else if (paymentStatus === "ready") {
    body = "Tracker ready ဖြစ်ပါပြီ။ Mini App ကိုဖွင့်ပြီး စသုံးနိုင်ပါပြီ။";
    rows.push([{ text: "Mini App ဖွင့်မယ်", web_app: { url: appUrl } }]);
  } else if (paymentStatus === "rejected") {
    body = "Payment screenshot ကို admin က reject လုပ်ထားပါတယ်။ Screenshot မှားနေလား၊ မရှင်းလား ဖြစ်နိုင်ပါတယ်။ မှန်တဲ့ screenshot ကို ဒီ chat ထဲကိုပြန်ပို့ပါ။";
    rows.push([{ text: "Package ပြန်ရွေးမယ်", callback_data: "buy" }]);
  } else {
    body = "Status စစ်နေပါတယ်။ မရသေးရင် /start ပြန်နှိပ်ပြီး ပြန်စစ်ပေးပါ။";
  }

  return {
    text: [
      "<b>Payment အခြေအနေ</b>",
      `Package: ${escapeHtml(registration.program_name || "Project Peak")}`,
      `လက်ရှိအခြေအနေ: <b>${escapeHtml(paymentStatusLabel(paymentStatus))}</b>`,
      "",
      body,
    ].join("\n"),
    rows: rows.length ? rows : undefined,
  };
}

async function handleCheckPaymentStatus(chatId: string, from: TelegramUser | undefined, baseUrl: string) {
  const telegramId = normalizeTelegramLoginId(String(from?.id || "")).replace(/^@/, "");
  if (!telegramId) {
    return sendMessageResponse(chatId, "သင့် Telegram ID ကိုမဖတ်နိုင်သေးပါ။ /start ကိုတစ်ခါပြန်နှိပ်ပေးပါနော်။");
  }

  const supabase = createAdminClient();
  const { data: registration, error } = await supabase
    .from("program_registrations")
    .select("id, program_name, payment_status, status")
    .eq("telegram_id", telegramId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  const appUrl = miniAppUrl(baseUrl, from);
  const copy = paymentStatusCopy(registration, appUrl);
  return sendMessageResponse(chatId, copy.text, copy.rows);
}

async function handleAdminPaymentAction(chatId: string, from: TelegramUser | undefined, data: string, baseUrl: string) {
  const telegramId = normalizeTelegramLoginId(String(from?.id || "")).replace(/^@/, "");
  if (!isAdminTelegramId(telegramId)) {
    return sendMessageResponse(chatId, "ဒီ action က admin account တွေအတွက်ပဲ ဖြစ်ပါတယ်။");
  }

  const [, action, registrationId] = data.split(":");
  if (!registrationId) {
    return sendMessageResponse(chatId, "Registration ID မတွေ့ပါ။ Admin dashboard ထဲကနေပြန်စစ်ပေးပါ။");
  }

  const supabase = createAdminClient();
  if (action === "approve") {
    const registration = await approvePaymentRegistration(supabase, registrationId);
    await sendTelegramMessageQuietly(
      String(registration.telegram_id || ""),
      "<b>Payment approve ဖြစ်ပါပြီ</b>\nAdmin က payment ကိုစစ်ပြီး approve လုပ်ပေးထားပါတယ်။ Tracker ပြင်ပြီး ready ဖြစ်တာနဲ့ Mini App ဖွင့်သုံးလို့ရပါမယ်။",
      miniAppUrl(baseUrl, { id: registration.telegram_id }),
      { buttonText: "Mini App ဖွင့်မယ်" },
    );
    return sendMessageResponse(chatId, "Payment approve လုပ်ပြီးပါပြီ။ Tracker/program ကိုစစ်ပြီး Send ready လုပ်ပေးပါ။", [
      [{ text: "Admin Mini App ဖွင့်မယ်", web_app: { url: miniAppUrl(baseUrl, from) } }],
    ]);
  }

  if (action === "reject") {
    const registration = await rejectPaymentRegistration(supabase, registrationId);
    await sendTelegramMessageQuietly(
      String(registration.telegram_id || ""),
      "<b>Payment screenshot ပြန်တင်ပေးပါဦးနော်</b>\nScreenshot မရှင်းတာ ဒါမှမဟုတ် payment detail မကိုက်တာကြောင့် admin က reject လုပ်ထားပါတယ်။ မှန်တဲ့ screenshot ကို ဒီ chat ထဲကို photo အနေနဲ့ပြန်ပို့ပေးပါ။",
    );
    return sendMessageResponse(chatId, "Payment screenshot ကို reject လုပ်ပြီးပါပြီ။ User ဆီကို ပြန်တင်ဖို့ message ပို့ထားပါတယ်။");
  }

  return sendMessageResponse(chatId, "ဒီ admin action ကို system မသိသေးပါ။ Dashboard ထဲကနေပြန်လုပ်ပေးပါ။");
}

async function handleDurationSelection(chatId: string, from: TelegramUser | undefined, data: string, baseUrl: string) {
  const [, packageKey, monthValue] = data.split(":");
  const months = Number(monthValue);
  const telegramId = normalizeTelegramLoginId(String(from?.id || "")).replace(/^@/, "");
  if (!telegramId) {
    return sendMessageResponse(chatId, "သင့် Telegram ID ကိုမဖတ်နိုင်သေးပါ။ /start ပြန်နှိပ်ပြီး package ပြန်ရွေးပေးပါနော်။");
  }

  const programs = await getFastProjectPrograms();
  if (!programs.length) return noPackagesResponse(chatId);
  const program = programs.find((item) => item.key === packageKey);
  if (!program) return noPackagesResponse(chatId);
  const duration = program.durations.find((item) => item.months === months) || program.durations[0];
  if (!duration) return noPackagesResponse(chatId);
  const accountPromise = seedTelegramUser(from).catch(() => null);
  const supabase = createAdminClient();

  const registration = {
    user_id: null,
    name: userDisplayName(from),
    age: 0,
    height: "",
    weight: 0,
    email: "",
    phone: "",
    telegram_id: telegramId,
    workout_split: "Admin ကပြင်ပေးမည့် custom plan",
    program_key: program.key,
    program_name: program.name,
    duration_months: duration.months,
    program_price: duration.price,
    payment_method: paymentMethods[0].label,
    status: "pending",
    payment_status: "awaiting_payment",
    notes: "Telegram bot checkout ကနေ create လုပ်ထားသည်။",
  };

  const { data: existingRegistration, error: lookupError } = await supabase
    .from("program_registrations")
    .select("id")
    .eq("telegram_id", telegramId)
    .in("payment_status", ["awaiting_payment", "rejected"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError) throw lookupError;

  const saveResult = existingRegistration?.id
    ? await supabase
        .from("program_registrations")
        .update({
          ...registration,
          created_at: new Date().toISOString(),
        })
        .eq("id", existingRegistration.id)
    : await supabase.from("program_registrations").insert(registration);

  if (saveResult.error) throw saveResult.error;

  void accountPromise.then(async (account) => {
    if (!account?.userId) return;
    await supabase
      .from("program_registrations")
      .update({ user_id: account.userId, email: account.email || "" })
      .eq("telegram_id", telegramId)
      .eq("payment_status", "awaiting_payment");
  }).catch(() => null);

  const qrUrl = `${baseUrl}${paymentMethods[0].qr}`;
  const caption = paymentCaption(program, duration.months, duration.price, telegramId);
  return sendPhotoResponse(chatId, qrUrl, caption);
}

async function handlePaymentScreenshot(chatId: string, from: TelegramUser | undefined, message: TelegramMessage, baseUrl: string) {
  const telegramId = normalizeTelegramLoginId(String(from?.id || "")).replace(/^@/, "");
  if (!telegramId) {
    await sendTelegramMessageQuietly(chatId, "သင့် Telegram ID ကိုမဖတ်နိုင်သေးပါ။ /start ပြန်နှိပ်ပြီး package ပြန်ရွေးပေးပါနော်။");
    return;
  }

  const largestPhoto = message.photo?.slice().sort((a, b) => (b.file_size || 0) - (a.file_size || 0))[0];
  const imageDocument = message.document?.mime_type?.startsWith("image/") ? message.document : null;
  const fileId = largestPhoto?.file_id || imageDocument?.file_id || "";

  if (!fileId) {
    await sendTelegramMessageQuietly(chatId, "Payment screenshot ကို photo ဒါမှမဟုတ် image file အနေနဲ့ ပို့ပေးပါနော်။");
    return;
  }

  const supabase = createAdminClient();
  const account = await seedTelegramUser(from).catch(() => null);
  const { data: registration, error: registrationError } = await supabase
    .from("program_registrations")
    .select("*")
    .eq("telegram_id", telegramId)
    .in("payment_status", ["awaiting_payment", "pending", "rejected"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (registrationError) throw registrationError;
  if (!registration) {
    await sendTelegramMessageQuietly(
      chatId,
      "Payment စောင့်နေတဲ့ package မတွေ့သေးပါ။ Package တွေကြည့်မယ် ကိုနှိပ်ပြီး package/duration အရင်ရွေးပေးပါနော်။",
    );
    return;
  }

  const fileUrl = await getTelegramFileUrl(fileId);
  if (!fileUrl) throw new Error("Could not get Telegram file URL.");
  const payment_screenshot = await uploadTelegramFile(fileUrl, telegramId);

  const updatedRegistration = {
    ...registration,
    payment_screenshot,
    status: "pending",
    payment_status: "pending",
  };

  const { error: updateError } = await supabase
    .from("program_registrations")
    .update({
      ...(account?.userId ? { user_id: account.userId, email: account.email || registration.email || "" } : {}),
      payment_screenshot,
      status: "pending",
      payment_status: "pending",
    })
    .eq("id", registration.id);

  if (updateError) throw updateError;

  const adminNotice = await notifyAdminsPayment(
    { ...updatedRegistration, id: registration.id },
    baseUrl,
  ).catch((err) => ({
    ok: false,
    error: err instanceof Error ? err.message : "Admin notification failed",
  }));

  try {
    await supabase.from("admin_notifications").insert({
      type: "payment_submitted",
      title: "Payment screenshot ရောက်ပြီ",
      body: `${registration.name || "Client"} က payment screenshot ပို့ထားပါတယ်။`,
      data: { registrationId: registration.id, telegramId, adminNotice },
      read: false,
    });
  } catch {
    // Optional migration table. Payment flow should keep working without it.
  }

  await sendTelegramMessageQuietly(
    chatId,
    adminNotice.ok === false
      ? "Payment screenshot ရပါပြီ။ Admin dashboard ထဲမှာ queue တက်ထားပါတယ်။ Admin ဆီ Telegram notification ပို့တာနည်းနည်း error ဖြစ်နိုင်လို့ ခဏကြာရင် /check-payment နဲ့ပြန်စစ်ပေးပါနော်။"
      : "Payment screenshot ရပါပြီ။ Admin ဆီကို image နဲ့တန်းပို့ထားပါတယ်။\n\nအခု tracker ပြင်ဖို့ လိုတဲ့ info လေးတွေကို ဒီ chat ထဲမှာ တစ်ခုချင်းမေးပါမယ်နော်။",
  );
  await sendNextIntakeQuestion(chatId, { ...updatedRegistration, id: registration.id });
}

export async function GET(request: Request) {
  return NextResponse.json({
    ok: true,
    appUrl: `${appBaseUrl(request)}/miniapp`,
    telegram: getTelegramRuntimeStatus(),
  });
}

export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET || "";
    if (
      webhookSecret &&
      request.headers.get("x-telegram-bot-api-secret-token") !== webhookSecret
    ) {
      return NextResponse.json({ ok: false, error: "Unauthorized webhook request." }, { status: 401 });
    }

    const telegramStatus = getTelegramRuntimeStatus();
    if (!telegramStatus.tokenConfigured) {
      return NextResponse.json(
        { ok: false, error: "TELEGRAM_BOT_TOKEN is missing in this deployment." },
        { status: 500 },
      );
    }

    const update = await request.json();
    const callbackQuery = update.callback_query as TelegramCallbackQuery | undefined;
    const message = (update.message || update.edited_message) as TelegramMessage | undefined;
    const baseUrl = appBaseUrl(request);

    if (callbackQuery?.id) {
      const chatId = callbackQuery.message?.chat?.id ? String(callbackQuery.message.chat.id) : String(callbackQuery.from?.id || "");
      const data = String(callbackQuery.data || "");
      void answerCallbackQuery(callbackQuery.id).catch(() => null);

      if (!chatId) return NextResponse.json({ ok: true, ignored: true });
      if (data === "buy") {
        return await handlePackageMenu(chatId);
      }
      if (data === "check_payment") {
        return await handleCheckPaymentStatus(chatId, callbackQuery.from, baseUrl);
      }
      if (data.startsWith("admin:")) {
        return await handleAdminPaymentAction(chatId, callbackQuery.from, data, baseUrl);
      }
      if (data.startsWith("pkg:")) {
        return await handlePackageDetails(chatId, data.split(":")[1], baseUrl);
      }
      if (data.startsWith("buy:")) {
        return await handleDurationSelection(chatId, callbackQuery.from, data, baseUrl);
      }

      return NextResponse.json({ ok: true, ignored: true });
    }

    const from = message?.from;
    const chatId = message?.chat?.id ? String(message.chat.id) : String(from?.id || "");
    const text = String(message?.text || "").trim();
    if (!chatId) return NextResponse.json({ ok: true, ignored: true });

    if (text === "/start" || text.startsWith("/start ")) {
      return await sendStartMenu(chatId, from, baseUrl);
    }

    if (text === "/packages" || text === "/package" || text === "/buy") {
      return await handlePackageMenu(chatId);
    }

    if (text === "/miniapp" || text === "/app") {
      return sendMessageResponse(chatId, "Mini App ကို အောက်က button ကနေဖွင့်နိုင်ပါတယ်။", [
        [{ text: "Mini App ဖွင့်မယ်", web_app: { url: miniAppUrl(baseUrl, from) } }],
      ]);
    }

    if (
      text === "/check-payment"
      || text === "/check_payment"
      || text === "Payment status"
      || text === "Payment status စစ်မယ်"
      || text === "Payment အခြေအနေစစ်မယ်"
    ) {
      return await handleCheckPaymentStatus(chatId, from, baseUrl);
    }

    if (text === "/help") {
      return sendMessageResponse(chatId, [
        "<b>Project Peak bot command တွေပါ</b>",
        "/start - Main menu ပြန်ဖွင့်မယ်",
        "/packages - Package တွေကြည့်မယ်",
        "/check_payment - Payment အခြေအနေစစ်မယ်",
        "/miniapp - Mini App ဖွင့်မယ်",
        "",
        "Payment screenshot ပို့ချင်ရင် ဒီ chat ထဲကို photo အနေနဲ့တန်းပို့ပေးပါ။",
      ].join("\n"), mainMenuRows(miniAppUrl(baseUrl, from)));
    }

    const handledIntakeReply = await handleIntakeReply(chatId, from, message || {});
    if (handledIntakeReply) {
      return NextResponse.json({ ok: true, handled: "intake-reply" });
    }

    if (message?.photo?.length || message?.document?.mime_type?.startsWith("image/")) {
      await handlePaymentScreenshot(chatId, from, message, baseUrl);
      return NextResponse.json({ ok: true, handled: "payment-screenshot" });
    }

    return sendMessageResponse(chatId, "ဘာလုပ်ချင်ပါသလဲ။ အောက်က menu ထဲကနေရွေးလိုက်ပါနော်။", [
      [{ text: "Package တွေကြည့်မယ်", callback_data: "buy" }],
      [{ text: "Payment အခြေအနေစစ်မယ်", callback_data: "check_payment" }],
      [{ text: "Mini App ဖွင့်မယ်", web_app: { url: miniAppUrl(baseUrl, from) } }],
    ]);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
