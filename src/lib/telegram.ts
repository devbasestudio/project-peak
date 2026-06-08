type TelegramPayload = Record<string, unknown>;

function telegramConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN || "";
  const adminIds = (process.env.TELEGRAM_ADMIN_IDS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return { token, adminIds, enabled: Boolean(token && adminIds.length) };
}

async function callTelegram(method: string, payload: TelegramPayload) {
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

export async function sendTelegramMessage(chatId: string, text: string, appUrl?: string) {
  if (!chatId) return { ok: false, skipped: true };
  return callTelegram("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: appUrl
      ? {
          inline_keyboard: [[{ text: "Open Project Peak", url: appUrl }]],
        }
      : undefined,
  });
}

export async function sendTelegramPhoto(chatId: string, photoUrl: string, caption: string, appUrl?: string) {
  if (!chatId || !photoUrl) return { ok: false, skipped: true };
  return callTelegram("sendPhoto", {
    chat_id: chatId,
    photo: photoUrl,
    caption,
    parse_mode: "HTML",
    reply_markup: appUrl
      ? {
          inline_keyboard: [[{ text: "Open Project Peak", url: appUrl }]],
        }
      : undefined,
  });
}

export async function notifyAdminsPayment(registration: any, appUrl: string) {
  const { adminIds, enabled } = telegramConfig();
  if (!enabled) return { ok: false, skipped: true };

  const text = [
    "<b>New Project Peak payment</b>",
    `Client: ${registration.name || registration.username || "Unknown"}`,
    `Program: ${registration.program_name || "Custom"}`,
    `Telegram ID: ${registration.telegram_id || "not provided"}`,
    `Email: ${registration.email || "not provided"}`,
  ].join("\n");

  const results = [];
  for (const adminId of adminIds) {
    results.push(await sendTelegramMessage(adminId, text, `${appUrl}/admin/dashboard`));
  }
  return { ok: true, results };
}

export async function notifyClientReady(telegramId: string, appUrl: string) {
  const text = [
    "<b>Your Project Peak plan is ready.</b>",
    "Admin approved your payment and prepared your daily tracker.",
    "Open the app and login with your Telegram ID.",
  ].join("\n");
  return sendTelegramMessage(telegramId, text, `${appUrl}/login`);
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
