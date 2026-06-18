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
      text: "Open App",
      web_app: { url: appUrl },
    },
  });
}

function telegramButton(appUrl?: string, options: TelegramButtonOptions = {}) {
  if (!appUrl) return undefined;
  const text = options.buttonText || "Open Project Peak";
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

  const adminUrl = `${appUrl}/admin/payments`;
  const caption = [
    "<b>New Project Peak payment</b>",
    `Client: ${registration.name || registration.username || "Unknown"}`,
    `Program: ${registration.program_name || "Custom"}`,
    registration.program_price ? `Amount: ${registration.program_price} MMK` : "",
    registration.payment_method ? `Method: ${registration.payment_method}` : "",
    `Telegram ID: ${registration.telegram_id || "not provided"}`,
    `Email: ${registration.email || "not provided"}`,
  ].filter(Boolean).join("\n");

  const results = [];
  for (const adminId of adminIds) {
    if (registration.payment_screenshot) {
      const photoResult = await sendTelegramPhoto(
        adminId,
        registration.payment_screenshot,
        caption,
        adminUrl,
        { buttonText: "Open admin payments", webApp: false },
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
      await sendTelegramMessage(
        adminId,
        registration.payment_screenshot
          ? `${caption}\nReceipt: ${registration.payment_screenshot}`
          : caption,
        adminUrl,
        { buttonText: "Open admin payments", webApp: false },
      ),
    );
  }
  return { ok: true, results };
}

export async function notifyAdminsApproval(registration: any, appUrl: string) {
  const { adminIds, enabled } = telegramConfig();
  if (!enabled) return { ok: false, skipped: true };

  const text = [
    "<b>Payment approved</b>",
    `Client: ${registration.name || registration.username || "Unknown"}`,
    `Program: ${registration.program_name || "Custom"}`,
    "Build or confirm the tracker, then send the ready link.",
  ].join("\n");

  const results = [];
  for (const adminId of adminIds) {
    results.push(
      await sendTelegramMessage(adminId, text, `${appUrl}/admin/trackers`, {
        buttonText: "Open trackers",
        webApp: false,
      }),
    );
  }
  return { ok: true, results };
}

export async function notifyClientReady(telegramId: string, appUrl: string) {
  const text = [
    "<b>Your Project Peak plan is ready.</b>",
    "Admin approved your payment and prepared your daily tracker.",
    "Open the Telegram Mini App to start using your tracker.",
  ].join("\n");
  return sendTelegramMessage(telegramId, text, `${appUrl}/miniapp`, {
    buttonText: "Open Mini App",
  });
}

export async function broadcastFeedbackMessage(telegramIds: string[], templateName: string, appUrl: string) {
  const results = [];
  for (const telegramId of telegramIds.filter(Boolean)) {
    results.push(
      await sendTelegramMessage(
        telegramId,
        `<b>${templateName}</b>\nPlease submit your Project Peak feedback form.`,
        `${appUrl}/user/dashboard`,
      ),
    );
  }
  return { ok: true, count: results.length, results };
}
