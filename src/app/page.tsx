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
    <main className="pp-shell pp-public-login">
      <motion.section
        className="pp-public-login__card"
      >
        <div className="pp-public-login__mark">
          <i className="ph ph-mountains" />
        </div>
        <p>Project Peak Main App</p>
        <h1>Login with Telegram username</h1>
        <span>
          Admin က ready link ပို့ပြီးသား user တွေအတွက် main app login ပါ။ Package ဝယ်ဖို့ Telegram bot ကနေဝယ်ပါ။
        </span>

        <form onSubmit={handleLogin}>
          <label>
            Telegram username / ID
            <input
              value={telegramId}
              onChange={(event) => setTelegramId(event.target.value)}
              placeholder="@username or 1827344905"
              required
            />
          </label>
          {error && (
            <div className="pp-status-box is-error">
              <i className="ph ph-warning" />
              <span>{error}</span>
            </div>
          )}
          <motion.button type="submit" disabled={submitting} whileTap={{ scale: 0.985 }}>
            <i className={`ph ${submitting ? "ph-spinner ph-spin" : "ph-telegram-logo"}`} />
            {submitting ? "Login link ပြင်နေပါသည်..." : "Main app ကိုဝင်မည်"}
          </motion.button>
        </form>

        <motion.a
          href={telegramBotUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="pp-public-login__bot"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.985 }}
        >
          <i className="ph ph-paper-plane-tilt" />
          Package ဝယ်ရန် Telegram bot ကိုဖွင့်မည်
        </motion.a>
      </motion.section>
    </main>
  );
}
