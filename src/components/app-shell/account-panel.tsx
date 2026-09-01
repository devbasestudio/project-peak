"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ChevronRight, Globe2, LogOut, Mail, Save, ShieldCheck, UserRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { signOut } from "@/app/actions";
import { updateCustomerProfile } from "@/app/customer-actions";
import type { Locale } from "@/lib/i18n";

export function AccountPanel({
  locale,
  email,
  displayName,
  avatarUrl,
  preferredLocale,
  program,
  order,
}: {
  locale: Locale;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  preferredLocale: Locale;
  program: { status: string; name: string; assignedDate: string } | null;
  order: { status: string; reference_code: string } | null;
}) {
  const mm = locale === "mm";
  const router = useRouter();
  const pathname = usePathname();
  const [name, setName] = useState(displayName);
  const [language, setLanguage] = useState<Locale>(preferredLocale);
  const [saving, setSaving] = useState(false);
  const initials = (name || email || "PP").split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
  const signOutWithLocale = signOut.bind(null, locale);

  async function saveProfile() {
    setSaving(true);
    try {
      const result = await updateCustomerProfile({ displayName: name, preferredLocale: language });
      if (!result.ok) {
        toast.error(mm ? "Profile သိမ်းမရဘူး" : "Could not save your profile", { description: result.message });
        return;
      }
      toast.success(mm ? "Profile သိမ်းပြီးပြီ" : "Profile saved");
      if (language !== locale) {
        router.replace(pathname.replace(/^\/(mm|en)/, `/${language}`));
      } else {
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <p className="text-xs font-semibold text-sky">PROJECT PEAK · MEMBER</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-[-.04em] sm:text-4xl">{mm ? "အကောင့်နှင့် Setting" : "Account settings"}</h1>
        <p className="mt-3 text-sm text-charcoal/50">{mm ? "နာမည်နဲ့ App ဘာသာစကားကို ဒီမှာပြောင်းနိုင်ပါတယ်။" : "Update your name and preferred app language."}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[.72fr_1fr]">
        <aside className="relative overflow-hidden rounded-2xl bg-charcoal p-6 text-white sm:p-7">
          <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl bg-sky font-display text-xl font-bold text-charcoal ring-4 ring-white/10">
            {avatarUrl ? <Image src={avatarUrl} alt={`${name || "Project Peak member"} profile photo`} width={80} height={80} referrerPolicy="no-referrer" className="h-full w-full object-cover" /> : initials}
          </div>
          <p className="mt-7 text-[10px] font-semibold text-white/35">PROJECT PEAK MEMBER</p>
          <h2 className="mt-2 break-words font-display text-2xl font-bold tracking-[-.03em]">{name || (mm ? "Project Peak Member" : "Project Peak member")}</h2>
          <p className="mt-2 break-all text-sm text-white/42">{email}</p>
          <div className="mt-10 border-t border-white/10 pt-5">
            <div className="flex items-center justify-between gap-4"><span className="text-xs text-white/38">{mm ? "Access" : "Access"}</span><span className="border border-sky/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sky">{program?.status ?? order?.status ?? "not active"}</span></div>
            {order ? <div className="mt-4 flex items-center justify-between gap-4"><span className="text-xs text-white/38">Reference</span><span className="mono text-xs">{order.reference_code}</span></div> : null}
          </div>
        </aside>

        <section className="rounded-2xl border border-charcoal/10 bg-white p-6 sm:p-7">
          <div className="flex items-center gap-3 border-b border-charcoal/8 pb-4"><UserRound size={19} /><h2 className="text-lg font-bold">{mm ? "ကိုယ်ရေးအချက်အလက်" : "Profile"}</h2></div>
          <label htmlFor="display-name" className="mt-7 block text-xs font-bold text-charcoal/45">{mm ? "နာမည်" : "Display name"}</label>
          <input id="display-name" value={name} maxLength={80} onChange={(event) => setName(event.target.value)} className="mt-2 min-h-13 w-full rounded-xl border border-charcoal/10 bg-[#f4f6f5] px-4 outline-none transition focus:border-sky" />
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#f4f6f5] p-4"><Mail size={17} className="text-charcoal/35" /><span className="min-w-0 flex-1 truncate text-sm">{email}</span><ShieldCheck size={17} /></div>

          <div className="mt-6 flex items-center gap-3"><Globe2 size={19} /><h2 className="text-base font-bold">{mm ? "App ဘာသာစကား" : "App language"}</h2></div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {(["mm", "en"] as const).map((value) => (
              <button key={value} type="button" onClick={() => setLanguage(value)} className={`flex min-h-12 items-center justify-between rounded-xl border px-4 text-sm font-semibold ${language === value ? "border-sky bg-ice" : "border-charcoal/10 bg-white"}`}>
                {value === "mm" ? "မြန်မာ" : "English"}{language === value ? <Check size={16} /> : null}
              </button>
            ))}
          </div>
          <button type="button" disabled={saving || !name.trim()} onClick={saveProfile} className="mt-6 flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-charcoal px-5 text-sm font-semibold text-white disabled:opacity-45"><Save size={17} />{saving ? (mm ? "သိမ်းနေပါတယ်…" : "Saving…") : (mm ? "ပြောင်းလဲမှု သိမ်းမယ်" : "Save changes")}</button>
        </section>
      </div>

      {program ? (
        <section className="mt-4 flex flex-col gap-5 rounded-2xl border border-charcoal/10 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="eyebrow text-charcoal/35">CURRENT PROGRAM</p><h2 className="mt-3 font-display text-2xl font-bold">{program.name}</h2><p className="mt-2 text-xs text-charcoal/42">{mm ? "Assign လုပ်ထားတဲ့ရက်" : "Assigned"} · {program.assignedDate}</p></div>
          <Link href={`/${locale}/app/progress`} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-charcoal/10 px-5 text-sm font-semibold hover:bg-paper">{mm ? "တိုးတက်မှုကြည့်မယ်" : "View progress"}<ChevronRight size={16} /></Link>
        </section>
      ) : null}

      <form action={signOutWithLocale} className="mt-4">
        <button className="flex min-h-13 w-full items-center justify-center gap-2 rounded-xl border border-charcoal/10 bg-white text-sm font-semibold text-charcoal/58 transition hover:bg-paper hover:text-charcoal"><LogOut size={17} />{mm ? "အကောင့်ထွက်မယ်" : "Sign out"}</button>
      </form>
    </div>
  );
}
