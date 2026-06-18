"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  copyText,
  readTelegramInitData,
  type TelegramIdentity,
  watchTelegramIdentity,
} from "@/lib/telegramWebApp";

const telegramBotUrl = process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL || "https://t.me/fdasfdsafsda_bot";

type AccessState = {
  status: "idle" | "loading" | "admin" | "ready" | "none" | "awaiting_payment" | "pending" | "approved" | "error";
  message?: string;
  actionLink?: string;
  programName?: string;
  paymentStatus?: string;
};

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function waitForTelegramInitData() {
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const initData = readTelegramInitData();
    if (initData) return initData;
    await wait(200);
  }
  return "";
}

function statusCopy(access: AccessState) {
  if (access.status === "admin") {
    return {
      title: "Opening admin dashboard",
      body: "Admin Telegram ID ဖြစ်တာကြောင့် admin dashboard ကိုတန်းပို့နေပါတယ်။",
      tone: "ready",
    };
  }
  if (access.status === "ready") {
    return {
      title: "Your tracker is ready",
      body: "Admin က custom tracker ပြင်ပြီးပါပြီ။ Mini App ကိုဖွင့်ပြီး daily tracker စသုံးနိုင်ပါပြီ။",
      tone: "ready",
    };
  }
  if (access.status === "awaiting_payment") {
    return {
      title: "Waiting for payment screenshot",
      body: "Telegram bot chat ထဲကို payment screenshot ပို့ပေးပါ။ Screenshot ရပြီးမှ admin review စပါမယ်။",
      tone: "waiting",
    };
  }
  if (access.status === "pending") {
    return {
      title: "Payment under review",
      body: "Admin က payment screenshot ကိုစစ်နေပါတယ်။ Approve ပြီး custom tracker ပြင်ပြီးမှ app ဖွင့်ပေးပါမယ်။",
      tone: "waiting",
    };
  }
  if (access.status === "approved") {
    return {
      title: "Approved, tracker is being prepared",
      body: "Payment approve ပြီးပါပြီ။ Admin က custom plan/tracker ပြင်ပြီး Ready link ပို့ပါမယ်။",
      tone: "waiting",
    };
  }
  if (access.status === "error") {
    return {
      title: "Access check failed",
      body: access.message || "ခဏနေ ပြန်စမ်းပါ။ မရသေးရင် admin ကိုပြောပေးပါ။",
      tone: "error",
    };
  }
  return {
    title: "Buy package in Telegram bot",
    body: "Package ဝယ်တာကို Telegram bot chat ထဲမှာပဲလုပ်ပါ။ Admin approve/ready ဖြစ်ပြီးမှ Mini App ကိုသုံးလို့ရပါမယ်။",
    tone: "waiting",
  };
}

export default function MiniAppClient() {
  const [telegramIdentity, setTelegramIdentity] = useState<TelegramIdentity | null>(null);
  const [access, setAccess] = useState<AccessState>({ status: "idle" });
  const [copiedTelegramId, setCopiedTelegramId] = useState(false);

  useEffect(() => {
    return watchTelegramIdentity(setTelegramIdentity);
  }, []);

  useEffect(() => {
    let disposed = false;

    async function checkAccess(identity: TelegramIdentity) {
      setAccess({ status: "loading" });
      try {
        const initData = await waitForTelegramInitData();
        if (!initData && process.env.NODE_ENV === "production") {
          throw new Error("Telegram bot ထဲက Open Mini App button နဲ့ပြန်ဖွင့်ပါ။");
        }

        const response = await fetch("/api/miniapp/access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            telegramId: identity.id,
            username: identity.username,
            displayName: identity.displayName,
            initData,
          }),
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Access check failed.");
        }
        if (disposed) return;
        setAccess(payload);
        if (payload.status === "admin" && payload.actionLink) {
          window.location.replace(payload.actionLink);
          return;
        }
        if (payload.status === "ready" && payload.actionLink) {
          window.setTimeout(() => {
            window.location.replace(payload.actionLink);
          }, 700);
        }
      } catch (err) {
        if (!disposed) {
          setAccess({
            status: "error",
            message: err instanceof Error ? err.message : "Access check failed.",
          });
        }
      }
    }

    if (telegramIdentity?.id) {
      checkAccess(telegramIdentity);
    } else {
      setAccess({ status: "idle" });
    }

    return () => {
      disposed = true;
    };
  }, [telegramIdentity]);

  async function handleCopyTelegramId() {
    if (!telegramIdentity?.id) return;
    const copied = await copyText(telegramIdentity.id);
    setCopiedTelegramId(copied);
    if (copied) {
      window.setTimeout(() => setCopiedTelegramId(false), 1600);
    }
  }

  const copy = statusCopy(access);
  const canOpenApp = Boolean(access.actionLink && (access.status === "ready" || access.status === "admin"));

  return (
    <main className="min-h-screen bg-[#f6f8f7] pb-8 text-[#1c2b29]">
      <div className="mx-auto flex min-h-screen w-full max-w-[760px] flex-col px-4 py-4">
        <header className="relative overflow-hidden rounded-3xl">
          <Image
            src="/img/hero_bg.jpg"
            alt="Project Peak mountain training"
            width={760}
            height={340}
            priority
            className="h-60 w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/5" />
          <div className="absolute bottom-0 left-0 p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-white/70">
              Project Peak Mini App
            </p>
            <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
              Approved members only
            </h1>
            <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-white/82">
              Package ဝယ်တာကို Telegram bot chat ထဲမှာလုပ်ပါ။ ဒီ Mini App က ready ဖြစ်ပြီးသား
              tracker ကိုသုံးဖို့ပဲဖြစ်ပါတယ်။
            </p>
          </div>
        </header>

        <section className="mt-4 rounded-3xl border border-[#e0e7e4] bg-white p-4 shadow-sm sm:p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-[#9aa8a4]">Telegram identity</p>
          {telegramIdentity ? (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-[#f6f8f7] p-3">
              <div className="min-w-0">
                <strong className="block truncate text-2xl font-extrabold text-[#1c2b29]">
                  {telegramIdentity.id}
                </strong>
                <span className="block truncate text-sm font-semibold text-[#6b7a77]">
                  {telegramIdentity.username ? `@${telegramIdentity.username}` : telegramIdentity.displayName}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyTelegramId}
                className="shrink-0 rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-[#1c2b29] shadow-sm"
              >
                {copiedTelegramId ? "Copied" : "Copy"}
              </button>
            </div>
          ) : (
            <p className="mt-3 rounded-2xl border border-[#f4d6a8] bg-[#fff7e8] px-4 py-3 text-sm font-bold leading-relaxed text-[#9a5a12]">
              Telegram bot မှာ /start နှိပ်ပြီး “Open Mini App” ကနေဖွင့်ပါ။ Telegram ID ကို
              user ကဖြည့်စရာမလိုဘဲ auto သိပါမယ်။
            </p>
          )}
        </section>

        <section className="mt-4 rounded-3xl border border-[#e0e7e4] bg-white p-5 shadow-sm">
          <div
            className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl ${
              copy.tone === "ready"
                ? "bg-[#dff5e8] text-[#207447]"
                : copy.tone === "error"
                  ? "bg-[#fdeee9] text-[#c0432b]"
                  : "bg-[#fff7e8] text-[#9a5a12]"
            }`}
          >
            <i
              className={`ph text-2xl ${
                access.status === "loading"
                  ? "ph-spinner animate-spin"
                  : copy.tone === "ready"
                    ? "ph-check-circle"
                    : copy.tone === "error"
                      ? "ph-warning"
                      : "ph-hourglass-medium"
              }`}
            />
          </div>

          <p className="text-xs font-bold uppercase tracking-wide text-[#9aa8a4]">
            {access.status === "loading" ? "Checking access" : "Access status"}
          </p>
          <h2 className="mt-1 text-2xl font-extrabold text-[#1c2b29]">{copy.title}</h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-[#6b7a77]">{copy.body}</p>
          {access.programName && (
            <p className="mt-3 rounded-2xl bg-[#f6f8f7] px-4 py-3 text-sm font-bold text-[#1c2b29]">
              Current package: {access.programName}
            </p>
          )}

          <div className="mt-5 flex flex-col gap-3">
            {canOpenApp && (
              <a
                href={access.actionLink}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#1c2b29] px-4 py-4 text-sm font-extrabold text-white no-underline"
              >
                <i className="ph ph-arrow-square-out text-lg" />
                {access.status === "admin" ? "Opening admin dashboard..." : "Open my tracker"}
              </a>
            )}
            <a
              href={telegramBotUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl border border-[#dbe4e0] bg-white px-4 py-4 text-sm font-extrabold text-[#1c2b29] no-underline"
            >
              <i className="ph ph-paper-plane-tilt text-lg" />
              Open Telegram bot
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
