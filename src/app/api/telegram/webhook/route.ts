import { NextResponse } from "next/server";
import { appBaseUrl, ensureTelegramUserAccount } from "@/lib/adminAuth";
import { getTelegramRuntimeStatus, sendTelegramMessage, sendTelegramPhoto } from "@/lib/telegram";

export async function GET(request: Request) {
  return NextResponse.json({
    ok: true,
    appUrl: `${appBaseUrl(request)}/miniapp`,
    telegram: getTelegramRuntimeStatus(),
  });
}

export async function POST(request: Request) {
  try {
    const telegramStatus = getTelegramRuntimeStatus();
    if (!telegramStatus.tokenConfigured) {
      return NextResponse.json(
        { ok: false, error: "TELEGRAM_BOT_TOKEN is missing in this deployment." },
        { status: 500 },
      );
    }

    const update = await request.json();
    const message = update.message || update.edited_message;
    const from = message?.from;
    const telegramId = from?.id ? String(from.id) : "";
    const chatId = message?.chat?.id ? String(message.chat.id) : telegramId;
    const text = String(message?.text || "").trim();

    if (!chatId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const baseUrl = appBaseUrl(request);
    const appUrl = `${baseUrl}/miniapp`;

    if (text === "/start" || text.startsWith("/start ")) {
      const startAppUrl = telegramId
        ? `${appUrl}?${new URLSearchParams({
            tg_id: telegramId,
            ...(from?.username ? { tg_username: String(from.username) } : {}),
            ...(from?.first_name || from?.last_name
              ? { tg_name: [from?.first_name, from?.last_name].filter(Boolean).join(" ") }
              : {}),
          }).toString()}`
        : appUrl;

      if (telegramId) {
        await ensureTelegramUserAccount({
          telegramId,
          username: from?.username ? String(from.username) : "",
          firstName: from?.first_name ? String(from.first_name) : "",
          lastName: from?.last_name ? String(from.last_name) : "",
        });
      }

      const caption = [
        "<b>Welcome to Project Peak</b>",
        telegramId ? `Your Telegram ID: <code>${telegramId}</code>` : "",
        "",
        "Choose your coaching package and upload payment proof from the Telegram mini app.",
        "You do not need to type your Telegram ID. The mini app will show it automatically.",
      ].filter((line, index, lines) => line || lines[index - 1]).join("\n");

      const heroUrl = `${baseUrl}/img/hero_bg.jpg`;
      const photoResult = await sendTelegramPhoto(chatId, heroUrl, caption, startAppUrl).catch(() => null);
      if (!photoResult?.ok) {
        const messageResult = await sendTelegramMessage(chatId, caption, startAppUrl);
        return NextResponse.json({ ok: Boolean(messageResult.ok), handled: "start", fallback: "message" });
      }

      return NextResponse.json({ ok: true, handled: "start", fallback: null });
    }

    const messageResult = await sendTelegramMessage(
      chatId,
      "Project Peak mini app ကိုဖွင့်ပြီး package ဝယ်ယူနိုင်ပါတယ်။",
      appUrl,
    );

    return NextResponse.json({ ok: Boolean(messageResult.ok) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
