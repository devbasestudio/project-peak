import Image from "next/image";

const telegramBotUrl = process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL || "https://t.me/fdasfdsafsda_bot";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#11211f] p-5 text-[#1c2b29]">
      <section className="w-full max-w-[460px] overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="relative h-56">
          <Image
            src="/img/hero_bg.jpg"
            alt="Project Peak"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-white/70">
              Project Peak
            </p>
            <h1 className="mt-1 text-3xl font-extrabold text-white">Telegram only</h1>
          </div>
        </div>

        <div className="p-6">
          <p className="text-sm font-semibold leading-relaxed text-[#6b7a77]">
            Project Peak ကို Telegram Bot နဲ့ Mini App ထဲမှာပဲသုံးပါတယ်။ Package ဝယ်တာကို
            bot chat ထဲမှာလုပ်ပြီး admin ready ပို့မှ Mini App ကိုဖွင့်နိုင်ပါမယ်။
          </p>
          <a
            href={telegramBotUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-[#1c2b29] px-4 py-4 text-sm font-extrabold text-white no-underline"
          >
            <i className="ph ph-paper-plane-tilt text-lg" />
            Open Telegram bot
          </a>
        </div>
      </section>
    </main>
  );
}
