"use client";

import { useState } from "react";
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
  preferredLocale,
  program,
  order,
}: {
  locale: Locale;
  email: string;
  displayName: string;
  preferredLocale: Locale;
  program: { status: string; name: string; assignedAt: string } | null;
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
    <div className="mx-auto max-w-4xl">
      <header className="mb-10 border-b-2 border-charcoal pb-7">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-charcoal/40">ATHLETE FILE · ACCOUNT</p>
        <h1 className="mt-4 font-display text-5xl font-black uppercase leading-[.9] tracking-[-.065em] sm:text-7xl">{mm ? "ကိုယ့်အကောင့်" : "Athlete file"}</h1>
      </header>

      <div className="grid gap-4 lg:grid-cols-[.72fr_1fr]">
        <aside className="relative overflow-hidden bg-charcoal p-6 text-white sm:p-8">
          <div className="absolute right-0 top-0 h-full w-2 bg-sky" />
          <div className="grid h-20 w-20 place-items-center border border-sky bg-sky font-display text-2xl font-black text-charcoal">{initials}</div>
          <p className="mt-12 font-mono text-[10px] uppercase tracking-[.18em] text-white/35">PROJECT PEAK / MEMBER</p>
          <h2 className="mt-3 break-words font-display text-3xl font-black uppercase tracking-[-.04em]">{name || (mm ? "Project Peak Member" : "Project Peak member")}</h2>
          <p className="mt-2 break-all text-sm text-white/42">{email}</p>
          <div className="mt-10 border-t border-white/10 pt-5">
            <div className="flex items-center justify-between gap-4"><span className="text-xs text-white/38">{mm ? "Access" : "Access"}</span><span className="border border-sky/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sky">{program?.status ?? order?.status ?? "not active"}</span></div>
            {order ? <div className="mt-4 flex items-center justify-between gap-4"><span className="text-xs text-white/38">Reference</span><span className="mono text-xs">{order.reference_code}</span></div> : null}
          </div>
        </aside>

        <section className="border border-charcoal/15 bg-white p-6 sm:p-8">
          <div className="flex items-center gap-3 border-b border-charcoal/15 pb-4"><UserRound size={19} /><h2 className="font-display text-2xl font-black uppercase">{mm ? "Profile" : "Profile"}</h2></div>
          <label htmlFor="display-name" className="mt-7 block text-xs font-bold text-charcoal/45">{mm ? "နာမည်" : "Display name"}</label>
          <input id="display-name" value={name} maxLength={80} onChange={(event) => setName(event.target.value)} className="mt-2 min-h-13 w-full border-b-2 border-charcoal/20 bg-paper px-4 outline-none transition focus:border-charcoal" />
          <div className="mt-5 flex items-center gap-3 border-y border-charcoal/10 bg-paper p-4"><Mail size={17} className="text-charcoal/35" /><span className="min-w-0 flex-1 truncate text-sm">{email}</span><ShieldCheck size={17} /></div>

          <div className="mt-7 flex items-center gap-3"><Globe2 size={19} /><h2 className="font-display text-xl font-black uppercase">{mm ? "ဘာသာစကား" : "Language"}</h2></div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {(["mm", "en"] as const).map((value) => (
              <button key={value} type="button" onClick={() => setLanguage(value)} className={`flex min-h-12 items-center justify-between border px-4 text-sm font-bold ${language === value ? "border-charcoal bg-sky" : "border-charcoal/15 bg-white"}`}>
                {value === "mm" ? "မြန်မာ" : "English"}{language === value ? <Check size={16} /> : null}
              </button>
            ))}
          </div>
          <button type="button" disabled={saving || !name.trim()} onClick={saveProfile} className="mt-7 flex min-h-13 w-full items-center justify-center gap-2 bg-charcoal px-5 text-sm font-bold text-white disabled:opacity-45"><Save size={17} />{saving ? (mm ? "သိမ်းနေတယ်…" : "Saving…") : (mm ? "ပြောင်းလဲမှုသိမ်းမယ်" : "Save changes")}</button>
        </section>
      </div>

      {program ? (
        <section className="mt-4 flex flex-col gap-5 border border-charcoal/15 bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div><p className="eyebrow text-charcoal/35">CURRENT PROGRAM</p><h2 className="mt-3 font-display text-2xl font-bold">{program.name}</h2><p className="mt-2 text-xs text-charcoal/42">{mm ? "Assign လုပ်ထားတဲ့ရက်" : "Assigned"} · {new Intl.DateTimeFormat(locale === "mm" ? "my-MM" : "en-US", { dateStyle: "medium", timeZone: "Asia/Yangon" }).format(new Date(program.assignedAt))}</p></div>
          <Link href={`/${locale}/app/progress`} className="flex min-h-12 items-center justify-center gap-2 border border-charcoal/15 px-5 text-sm font-bold hover:bg-paper">{mm ? "တိုးတက်မှုကြည့်မယ်" : "View progress"}<ChevronRight size={16} /></Link>
        </section>
      ) : null}

      <form action={signOutWithLocale} className="mt-4">
        <button className="flex min-h-13 w-full items-center justify-center gap-2 border border-charcoal/15 bg-white text-sm font-bold text-charcoal/58 transition hover:bg-paper hover:text-charcoal"><LogOut size={17} />{mm ? "အကောင့်ထွက်မယ်" : "Sign out"}</button>
      </form>
    </div>
  );
}
