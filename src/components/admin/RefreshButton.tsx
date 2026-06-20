"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={pending}
      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#d8dedb] bg-white px-3 py-2 text-sm font-bold text-[#1c2b29] shadow-sm transition hover:bg-[#f6f8f7] disabled:cursor-not-allowed disabled:opacity-60"
      aria-label="Reload latest data"
      title="Reload latest data"
    >
      <i className={`ph ph-arrow-clockwise text-base ${pending ? "animate-spin" : ""}`} />
      <span className="hidden sm:inline">{pending ? "Reloading" : "Reload"}</span>
    </button>
  );
}
