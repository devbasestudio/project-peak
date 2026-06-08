"use client";

import { FormEvent, useState } from "react";
import { motion } from "framer-motion";

const telegramBotUrl = process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL || "https://t.me/fdasfdsafsda_bot";

export default function Home() {
  const [telegramId, setTelegramId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/telegram-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Login failed.");
      }
      window.location.href = payload.actionLink;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1c2b29] via-[#2a3f3c] to-[#1c2b29] p-5">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[420px] rounded-3xl border border-white/10 bg-white p-7 shadow-2xl sm:p-9"
      >
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-[#1c2b29] text-[#ff6b35]">
          <i className="ph-fill ph-mountains text-2xl" />
        </div>
        <p className="text-xs font-bold uppercase tracking-wide text-[#9aa8a4]">
          Project Peak Main App
        </p>
        <h1 className="mt-1 text-2xl font-extrabold text-[#1c2b29]">Login with Telegram</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#6b7a77]">
          Admin က ready link ပို့ပြီးသား user တွေအတွက် main app login ပါ။ Package ဝယ်ဖို့ Telegram bot
          ကနေဝယ်ပါ။
        </p>

        <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#3a4744]">
            Telegram username / ID
            <input
              value={telegramId}
              onChange={(event) => setTelegramId(event.target.value)}
              placeholder="@username or 1827344905"
              required
              className="w-full rounded-xl border border-[#d8dedb] bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#1c2b29] focus:ring-2 focus:ring-[#1c2b29]/10"
            />
          </label>
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-[#f4c7bd] bg-[#fdeee9] px-3 py-2 text-sm font-semibold text-[#c0432b]">
              <i className="ph ph-warning text-base" />
              <span>{error}</span>
            </div>
          )}
          <motion.button
            type="submit"
            disabled={submitting}
            whileTap={{ scale: 0.985 }}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#1c2b29] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#26403c] disabled:opacity-60"
          >
            <i className={`ph ${submitting ? "ph-spinner animate-spin" : "ph-telegram-logo"} text-base`} />
            {submitting ? "Login link ပြင်နေပါသည်..." : "Main app ကိုဝင်မည်"}
          </motion.button>
        </form>

        <motion.a
          href={telegramBotUrl}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.985 }}
          className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-[#e6eae8] px-4 py-3 text-sm font-bold text-[#1c2b29] no-underline transition hover:bg-[#f6f8f7]"
        >
          <i className="ph ph-paper-plane-tilt text-base" />
          Package ဝယ်ရန် Telegram bot ကိုဖွင့်မည်
        </motion.a>
      </motion.section>
    </main>
  );
}
