import { NextResponse } from "next/server";
import { appBaseUrl } from "@/lib/adminAuth";
import { sendTelegramMessage, sendTelegramPhoto } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const update = await request.json();
    const message = update.message || update.edited_message;
    const chatId = message?.chat?.id ? String(message.chat.id) : "";
    const text = String(message?.text || "").trim();

    if (!chatId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const baseUrl = appBaseUrl(request);
    const appUrl = `${baseUrl}/`;

    if (text === "/start" || text.startsWith("/start ")) {
      const caption = [
        "<b>Welcome to Project Peak</b>",
        "Choose your coaching package, upload payment proof, and track your daily plan from one compact app.",
      ].join("\n");

      const heroUrl = `${baseUrl}/img/hero_bg.jpg`;
      const photoResult = await sendTelegramPhoto(chatId, heroUrl, caption, appUrl).catch(() => null);
      if (!photoResult) {
        await sendTelegramMessage(chatId, caption, appUrl).catch(() => null);
      }

      return NextResponse.json({ ok: true, handled: "start" });
    }

    await sendTelegramMessage(
      chatId,
      "Project Peak app ကိုဖွင့်ပြီး package/payment status ကိုစစ်နိုင်ပါတယ်။",
      appUrl,
    ).catch(() => null);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
