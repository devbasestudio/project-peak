type TelegramPayload = Record<string, unknown>;

type TelegramButtonOptions = {
  buttonText?: string;
  webApp?: boolean;
};

export type TelegramInlineButton = {
  text: string;
  callback_data?: string;
  url?: string;
  web_app?: { url: string };
};

function telegramConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN || "";
  const adminIds = (process.env.TELEGRAM_ADMIN_IDS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return { token, adminIds, enabled: Boolean(token && adminIds.length) };
}

function escapeTelegramHtml(value: unknown) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getTelegramRuntimeStatus() {
  const { token, adminIds, enabled } = telegramConfig();
  return {
    tokenConfigured: Boolean(token),
    adminIdsConfigured: adminIds.length > 0,
    adminIdsCount: adminIds.length,
    adminNotificationsEnabled: enabled,
  };
}

export async function callTelegram(method: string, payload: TelegramPayload) {
  const { token } = telegramConfig();
  if (!token) return { ok: false, skipped: true };

  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram ${method} failed: ${body}`);
  }

  return response.json();
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  if (!callbackQueryId) return { ok: false, skipped: true };
  return callTelegram("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
  });
}

export async function setTelegramChatMenuButton(chatId: string, appUrl: string) {
  if (!chatId || !appUrl) return { ok: false, skipped: true };
  return callTelegram("setChatMenuButton", {
    chat_id: chatId,
    menu_button: {
      type: "web_app",
      text: "Mini App ဖွင့်မယ်",
      web_app: { url: appUrl },
    },
  });
}

function telegramButton(appUrl?: string, options: TelegramButtonOptions = {}) {
  if (!appUrl) return undefined;
  const text = options.buttonText || "Project Peak ဖွင့်မယ်";
  const button = options.webApp === false ? { text, url: appUrl } : { text, web_app: { url: appUrl } };
  return { inline_keyboard: [[button]] };
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  appUrl?: string,
  options?: TelegramButtonOptions,
) {
  if (!chatId) return { ok: false, skipped: true };
  return callTelegram("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: telegramButton(appUrl, options),
  });
}

export async function sendTelegramButtons(chatId: string, text: string, rows: TelegramInlineButton[][]) {
  if (!chatId) return { ok: false, skipped: true };
  return callTelegram("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: rows },
  });
}

export async function sendTelegramPhoto(
  chatId: string,
  photoUrl: string,
  caption: string,
  appUrl?: string,
  options?: TelegramButtonOptions,
) {
  if (!chatId || !photoUrl) return { ok: false, skipped: true };
  return callTelegram("sendPhoto", {
    chat_id: chatId,
    photo: photoUrl,
    caption,
    parse_mode: "HTML",
    reply_markup: telegramButton(appUrl, options),
  });
}

export async function sendTelegramPhotoButtons(
  chatId: string,
  photoUrl: string,
  caption: string,
  rows: TelegramInlineButton[][],
) {
  if (!chatId || !photoUrl) return { ok: false, skipped: true };
  return callTelegram("sendPhoto", {
    chat_id: chatId,
    photo: photoUrl,
    caption,
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: rows },
  });
}

export async function getTelegramFileUrl(fileId: string) {
  const { token } = telegramConfig();
  if (!token || !fileId) return "";
  const file = await callTelegram("getFile", { file_id: fileId });
  const filePath = (file as any)?.result?.file_path;
  return filePath ? `https://api.telegram.org/file/bot${token}/${filePath}` : "";
}

export async function notifyAdminsPayment(registration: any, appUrl: string) {
  const { adminIds, enabled } = telegramConfig();
  if (!enabled) return { ok: false, skipped: true };

  const registrationId = String(registration.id || "");
  const reviewRows: TelegramInlineButton[][] = [
    registrationId
      ? [
          { text: "Payment approve လုပ်မယ်", callback_data: `admin:approve:${registrationId}` },
          { text: "Reject လုပ်မယ်", callback_data: `admin:reject:${registrationId}` },
        ]
      : [],
    [{ text: "Admin Mini App ဖွင့်မယ်", web_app: { url: `${appUrl}/miniapp` } }],
  ].filter((row) => row.length);
  const caption = [
    "<b>Payment screenshot အသစ်ရောက်ပါတယ်</b>",
    `User: ${escapeTelegramHtml(registration.name || registration.username || "မသိရသေးပါ")}`,
    `Package: ${escapeTelegramHtml(registration.program_name || "Custom")}`,
    registration.program_price ? `ကျသင့်ငွေ: ${escapeTelegramHtml(registration.program_price)} MMK` : "",
    registration.payment_method ? `ငွေလွှဲနည်းလမ်း: ${escapeTelegramHtml(registration.payment_method)}` : "",
    `Telegram ID: ${escapeTelegramHtml(registration.telegram_id || "မပါသေးပါ")}`,
    "",
    "Screenshot ကိုစစ်ပြီး အောက်က button ကနေ approve သို့မဟုတ် reject လုပ်ပေးပါ။",
  ].filter(Boolean).join("\n");

  const results = [];
  for (const adminId of adminIds) {
    if (registration.payment_screenshot) {
      const photoResult = await sendTelegramPhotoButtons(
        adminId,
        registration.payment_screenshot,
        caption,
        reviewRows,
      ).catch((err) => ({
        ok: false,
        error: err instanceof Error ? err.message : "Telegram photo failed",
      }));

      if (photoResult && typeof photoResult === "object" && "ok" in photoResult && photoResult.ok) {
        results.push(photoResult);
        continue;
      }
    }

    results.push(
      await sendTelegramButtons(
        adminId,
        registration.payment_screenshot
          ? `${caption}\n\nScreenshot link: ${registration.payment_screenshot}`
          : caption,
        reviewRows,
      ),
    );
  }
  return { ok: true, results };
}

export async function notifyAdminsApproval(registration: any, appUrl: string) {
  const { adminIds, enabled } = telegramConfig();
  if (!enabled) return { ok: false, skipped: true };

  const text = [
    "<b>Payment approve လုပ်ပြီးပါပြီ</b>",
    `User: ${escapeTelegramHtml(registration.name || registration.username || "မသိရသေးပါ")}`,
    `Package: ${escapeTelegramHtml(registration.program_name || "Custom")}`,
    "အခု user အတွက် tracker/program ကိုစစ်ပြီး ready link ပို့ပေးနိုင်ပါပြီ။",
  ].join("\n");

  const results = [];
  for (const adminId of adminIds) {
    results.push(
      await sendTelegramButtons(adminId, text, [
        [{ text: "Admin Mini App ဖွင့်မယ်", web_app: { url: `${appUrl}/miniapp` } }],
      ]),
    );
  }
  return { ok: true, results };
}

export async function notifyClientReady(telegramId: string, appUrl: string) {
  const text = [
    "<b>Project Peak tracker ready ဖြစ်ပါပြီ</b>",
    "Payment approve ပြီး သင့်အတွက် daily tracker ကိုပြင်ပေးထားပါတယ်။",
    "အောက်က button ကနေ Telegram Mini App ကိုဖွင့်ပြီး စသုံးလို့ရပါပြီ။",
  ].join("\n");
  return sendTelegramMessage(telegramId, text, `${appUrl}/miniapp`, {
    buttonText: "Mini App ဖွင့်မယ်",
  });
}

export async function broadcastFeedbackMessage(telegramIds: string[], templateName: string, appUrl: string) {
  const results = [];
  for (const telegramId of telegramIds.filter(Boolean)) {
    results.push(
      await sendTelegramMessage(
        telegramId,
        `<b>${escapeTelegramHtml(templateName)}</b>\nဒီတစ်ခေါက် feedback form လေး ဖြည့်ပေးပါဦး။ သင့် progress ကိုပိုကောင်းအောင် ပြန်ညှိပေးဖို့ပါ။`,
        `${appUrl}/miniapp`,
        { buttonText: "Feedback ဖြည့်မယ်" },
      ),
    );
  }
  return { ok: true, count: results.length, results };
}

export async function broadcastAdminMessage(telegramIds: string[], message: string, appUrl: string) {
  const cleanMessage = String(message || "").trim();
  if (!cleanMessage) return { ok: false, count: 0, results: [] };

  const results = [];
  const uniqueTelegramIds = Array.from(new Set(telegramIds.map((id) => String(id || "").trim()).filter(Boolean)));
  for (const telegramId of uniqueTelegramIds) {
    results.push(
      await sendTelegramMessage(
        telegramId,
        `<b>Project Peak မှ message ပါ</b>\n${escapeTelegramHtml(cleanMessage)}`,
        `${appUrl}/miniapp`,
        { buttonText: "Mini App ဖွင့်မယ်" },
      ),
    );
  }
  return { ok: true, count: results.length, results };
}
