import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import {
  appBaseUrl,
  ensureTelegramUserAccount,
  isAdminTelegramId,
  normalizeTelegramLoginId,
} from "@/lib/adminAuth";
import { getPublicProjectPrograms } from "@/lib/programCatalog";
import { formatMmk, paymentMethods, type ProjectProgram } from "@/lib/projectPeakConfig";
import {
  answerCallbackQuery,
  getTelegramFileUrl,
  getTelegramRuntimeStatus,
  notifyAdminsPayment,
  sendTelegramButtons,
  sendTelegramMessage,
  sendTelegramPhoto,
  sendTelegramPhotoButtons,
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

function durationRows(program: ProjectProgram): TelegramInlineButton[][] {
  const rows = program.durations.map((duration) => [
    {
      text: `${duration.label} | ${formatMmk(duration.price)}`,
      callback_data: `buy:${program.key}:${duration.months}`,
    },
  ]);
  rows.push([{ text: "Package အားလုံးပြန်ကြည့်မယ်", callback_data: "buy" }]);
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

function packageSummary(programs: ProjectProgram[]) {
  const lines = programs.map((program, index) => {
    const startPrice = program.durations[0]?.price ? formatMmk(program.durations[0].price) : "";
    return `${index + 1}. <b>${escapeHtml(program.shortName)}</b>${startPrice ? ` - ${startPrice} မှစ` : ""}`;
  });

  return [
    "<b>Project Peak Packages</b>",
    "Package တစ်ခုကိုရွေးပါ။",
    "ရွေးပြီးမှ photo, detail, price နဲ့ duration buttons ကိုပြပေးပါမယ်။",
    "",
    ...lines,
  ].join("\n");
}

function packageCaption(program: ProjectProgram) {
  const includes = program.includes.slice(0, 3).map((item) => `• ${escapeHtml(item.title)}`).join("\n");
  const prices = program.durations
    .map((duration) => `${escapeHtml(duration.label)}: ${formatMmk(duration.price)}`)
    .join("\n");

  return telegramCaption([
    `<b>${escapeHtml(program.name)}</b>`,
    escapeHtml(program.headline),
    "",
    `<b>သင့်တော်တဲ့သူ</b>\n${escapeHtml(program.bestFor)}`,
    "",
    `<b>ပါဝင်တာတွေ</b>\n${includes}`,
    "",
    `<b>ဈေးနှုန်း</b>\n${prices}`,
    "",
    "ဝယ်မယ်ဆိုရင် အောက်က duration ကိုနှိပ်ပါ။ Payment QR ကိုချက်ချင်းပို့ပေးပါမယ်။",
  ]);
}

function paymentCaption(program: ProjectProgram, months: number, price: number, telegramId: string) {
  const paymentMethod = paymentMethods[0];
  return [
    "<b>Payment Detail</b>",
    `Package: ${escapeHtml(program.name)}`,
    `Duration: ${months} month${months > 1 ? "s" : ""}`,
    `Amount: ${formatMmk(price)}`,
    `Pay with: ${escapeHtml(paymentMethod.label)}`,
    "",
    `Telegram ID: <code>${telegramId}</code>`,
    "",
    "Payment လုပ်ပြီးရင် screenshot ကို ဒီ chat ထဲကို photo အနေနဲ့ပို့ပေးပါ။",
    "Admin စစ်ပြီး approve လုပ်ပြီးမှ သင့်အတွက် tracker ကိုဖွင့်ပေးပါမယ်။",
  ].join("\n");
}

async function uploadTelegramFile(fileUrl: string, telegramId: string) {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error("Could not download Telegram payment screenshot.");
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  const buffer = Buffer.from(await response.arrayBuffer());
  const filename = `telegram_payment_${telegramId}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`;
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

async function sendStartMenu(chatId: string, from: TelegramUser | undefined, baseUrl: string) {
  const telegramId = normalizeTelegramLoginId(String(from?.id || "")).replace(/^@/, "");
  const appUrl = miniAppUrl(baseUrl, from);
  void seedTelegramUser(from).catch(() => null);
  void setTelegramChatMenuButton(chatId, appUrl).catch(() => null);

  const text = [
    "<b>Project Peak မှကြိုဆိုပါတယ်</b>",
    telegramId ? `သင့် Telegram ID: <code>${telegramId}</code>` : "",
    "",
    "ဒီ chat ထဲမှာ package ရွေးပြီး payment လုပ်နိုင်ပါတယ်။",
    "Admin approve ပြီး tracker ready ဖြစ်မှ Mini App ကိုသုံးလို့ရပါမယ်။",
  ].filter(Boolean).join("\n");

  return sendTelegramButtons(chatId, text, [
    [{ text: "Package ကြည့်မယ်", callback_data: "buy" }],
    [{ text: "Mini App ဖွင့်မယ်", web_app: { url: appUrl } }],
  ]);
}

async function handlePackageMenu(chatId: string) {
  const programs = await getPublicProjectPrograms();
  return sendTelegramButtons(
    chatId,
    packageSummary(programs),
    packageRows(programs),
  );
}

async function sendPackageCard(chatId: string, baseUrl: string, program: ProjectProgram) {
  const caption = packageCaption(program);
  const rows = durationRows(program);
  const result = await sendTelegramPhotoButtons(
    chatId,
    assetUrl(baseUrl, program.image),
    caption,
    rows,
  ).catch(() => null);

  if (result && typeof result === "object" && "ok" in result && result.ok) {
    return result;
  }

  return sendTelegramButtons(chatId, caption, rows);
}

async function handlePackageDetails(chatId: string, packageKey: string, baseUrl: string) {
  const programs = await getPublicProjectPrograms();
  const program = programs.find((item) => item.key === packageKey) || programs[0];
  return sendPackageCard(chatId, baseUrl, program);
}

async function handleDurationSelection(chatId: string, from: TelegramUser | undefined, data: string, baseUrl: string) {
  const [, packageKey, monthValue] = data.split(":");
  const months = Number(monthValue);
  const telegramId = normalizeTelegramLoginId(String(from?.id || "")).replace(/^@/, "");
  if (!telegramId) {
    return sendTelegramMessage(chatId, "Telegram ID မတွေ့ပါ။ /start ပြန်နှိပ်ပြီး package ပြန်ရွေးပါ။");
  }

  const programs = await getPublicProjectPrograms();
  const program = programs.find((item) => item.key === packageKey) || programs[0];
  const duration = program.durations.find((item) => item.months === months) || program.durations[0];
  const account = await seedTelegramUser(from);
  const supabase = createAdminClient();

  const registration = {
    user_id: account?.userId || null,
    name: userDisplayName(from),
    age: 0,
    height: "",
    weight: 0,
    email: account?.email || "",
    phone: "",
    telegram_id: telegramId,
    workout_split: "Admin customized plan",
    program_name: program.name,
    duration_months: duration.months,
    program_price: duration.price,
    payment_method: paymentMethods[0].label,
    status: "awaiting_payment",
    payment_status: "awaiting_payment",
    notes: "Created from Telegram bot checkout.",
  };

  const { data: existingRegistration, error: lookupError } = await supabase
    .from("program_registrations")
    .select("id")
    .eq("telegram_id", telegramId)
    .eq("status", "awaiting_payment")
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

  const qrUrl = `${baseUrl}${paymentMethods[0].qr}`;
  const caption = paymentCaption(program, duration.months, duration.price, telegramId);
  const result = await sendTelegramPhoto(chatId, qrUrl, caption).catch(() => null);
  if (!result?.ok) {
    await sendTelegramMessage(chatId, `${caption}\n\nQR: ${qrUrl}`);
  }

  return { ok: true };
}

async function handlePaymentScreenshot(chatId: string, from: TelegramUser | undefined, message: TelegramMessage, baseUrl: string) {
  const telegramId = normalizeTelegramLoginId(String(from?.id || "")).replace(/^@/, "");
  if (!telegramId) {
    return sendTelegramMessage(chatId, "Telegram ID မတွေ့ပါ။ /start ပြန်နှိပ်ပြီး package ပြန်ရွေးပါ။");
  }

  const largestPhoto = message.photo?.slice().sort((a, b) => (b.file_size || 0) - (a.file_size || 0))[0];
  const imageDocument = message.document?.mime_type?.startsWith("image/") ? message.document : null;
  const fileId = largestPhoto?.file_id || imageDocument?.file_id || "";

  if (!fileId) {
    return sendTelegramMessage(chatId, "Payment screenshot ကို photo/image file အနေနဲ့ ပို့ပေးပါ။");
  }

  const supabase = createAdminClient();
  const { data: registration, error: registrationError } = await supabase
    .from("program_registrations")
    .select("*")
    .eq("telegram_id", telegramId)
    .eq("status", "awaiting_payment")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (registrationError) throw registrationError;
  if (!registration) {
    return sendTelegramMessage(
      chatId,
      "Payment စောင့်နေတဲ့ package မတွေ့ပါ။ Buy Package ကိုနှိပ်ပြီး package/duration အရင်ရွေးပါ။",
    );
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
      payment_screenshot,
      status: "pending",
      payment_status: "pending",
    })
    .eq("id", registration.id);

  if (updateError) throw updateError;

  await notifyAdminsPayment(updatedRegistration, baseUrl).catch(() => null);

  return sendTelegramMessage(
    chatId,
    "Payment screenshot ရပါပြီ။ Admin ဆီကို image နဲ့တန်းပို့ထားပါတယ်။ စစ်ပြီး approve လုပ်ပြီးတာနဲ့ tracker ready ဖြစ်ရင် Mini App ဖွင့်နိုင်ပါမယ်။",
    miniAppUrl(baseUrl, from),
    { buttonText: "Open Mini App" },
  );
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
      await answerCallbackQuery(callbackQuery.id).catch(() => null);

      if (!chatId) return NextResponse.json({ ok: true, ignored: true });
      if (data === "buy") {
        await handlePackageMenu(chatId);
        return NextResponse.json({ ok: true, handled: "package-menu" });
      }
      if (data.startsWith("pkg:")) {
        await handlePackageDetails(chatId, data.split(":")[1], baseUrl);
        return NextResponse.json({ ok: true, handled: "package-details" });
      }
      if (data.startsWith("buy:")) {
        await handleDurationSelection(chatId, callbackQuery.from, data, baseUrl);
        return NextResponse.json({ ok: true, handled: "duration" });
      }

      return NextResponse.json({ ok: true, ignored: true });
    }

    const from = message?.from;
    const chatId = message?.chat?.id ? String(message.chat.id) : String(from?.id || "");
    const text = String(message?.text || "").trim();
    if (!chatId) return NextResponse.json({ ok: true, ignored: true });

    if (text === "/start" || text.startsWith("/start ")) {
      await sendStartMenu(chatId, from, baseUrl);
      return NextResponse.json({ ok: true, handled: "start" });
    }

    if (message?.photo?.length || message?.document?.mime_type?.startsWith("image/")) {
      await handlePaymentScreenshot(chatId, from, message, baseUrl);
      return NextResponse.json({ ok: true, handled: "payment-screenshot" });
    }

    await sendTelegramButtons(chatId, "ဘာလုပ်ချင်ပါသလဲ?", [
      [{ text: "Package ကြည့်မယ်", callback_data: "buy" }],
      [{ text: "Mini App ဖွင့်မယ်", web_app: { url: miniAppUrl(baseUrl, from) } }],
    ]);

    return NextResponse.json({ ok: true, handled: "menu" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
