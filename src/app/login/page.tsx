const telegramBotUrl = process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL || "https://t.me/fdasfdsafsda_bot";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#142420] p-6 text-white">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-[#ff6b35]/15 text-[#ff6b35]">
          <i className="ph ph-telegram-logo text-3xl" />
        </div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/40">Project Peak Mini App</p>
        <h1 className="mt-2 text-3xl font-black">Telegram only login</h1>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-white/60">
          Project Peak ကို website login နဲ့မသုံးတော့ပါ။ Telegram bot မှာ /start နှိပ်ပြီး
          Open Mini App button ကနေဝင်ပါ။
        </p>
        <a
          href={telegramBotUrl}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ff6b35] px-5 py-4 text-sm font-black text-white no-underline"
        >
          <i className="ph ph-paper-plane-tilt text-lg" />
          Open Telegram bot
        </a>
      </section>
    </main>
  );
}
