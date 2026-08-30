"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, KeyRound, LoaderCircle, Mail } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n";

export function AuthCard({ locale, nextPath }: { locale: Locale; nextPath: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<"google" | "email" | "password" | null>(null);
  const mm = locale === "mm";

  const callbackUrl = () => {
    const next = nextPath.startsWith("/") ? nextPath : `/${locale}/app`;
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  };

  async function signInWithGoogle() {
    try {
      setLoading("google");
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl() },
      });
      if (error) throw error;
    } catch (error) {
      setLoading(null);
      toast.error(mm ? "Google login မဖွင့်ရသေးဘူး" : "Google sign-in is not configured yet", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  async function sendMagicLink(event: FormEvent) {
    event.preventDefault();
    try {
      setLoading("email");
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: callbackUrl() },
      });
      if (error) throw error;
      toast.success(mm ? "Email ထဲက login link ကိုဖွင့်ပါ" : "Open the sign-in link in your email");
    } catch (error) {
      toast.error(mm ? "Login link ပို့မရဘူး" : "Could not send the sign-in link", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setLoading(null);
    }
  }

  async function signInWithPassword() {
    try {
      setLoading("password");
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.assign(nextPath.startsWith("/") ? nextPath : `/${locale}/app`);
    } catch (error) {
      toast.error(mm ? "Email သို့မဟုတ် password မမှန်ဘူး" : "Email or password is incorrect", {
        description: error instanceof Error ? error.message : undefined,
      });
      setLoading(null);
    }
  }

  return (
    <main lang={mm ? "my" : "en"} className="editorial-grid min-h-screen bg-paper text-charcoal">
      <header className="flex min-h-20 items-center justify-between border-b border-charcoal/15 bg-paper/90 px-4 backdrop-blur-xl sm:px-8 lg:px-12">
        <Link href={`/${locale}`} aria-label="Project Peak home"><Image src="/brand/logo-dark.svg" alt="Project Peak" width={172} height={48} priority /></Link>
        <div className="flex items-center gap-3"><Link href={`/${locale}`} className="hidden items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-charcoal/50 sm:flex"><ArrowLeft size={14} />{mm ? "Home ပြန်မယ်" : "Back home"}</Link><Link href={`/${mm ? "en" : "mm"}/login?next=${encodeURIComponent(nextPath)}`} className="secondary-button min-h-10 px-3 py-2">{mm ? "EN" : "မြန်မာ"}</Link></div>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-[1440px] lg:grid-cols-[1.15fr_.85fr]">
        <section className="relative flex min-h-[48vh] flex-col justify-between overflow-hidden border-b border-charcoal/15 p-5 sm:p-10 lg:min-h-0 lg:border-b-0 lg:border-r lg:p-14">
          <div className="absolute inset-0 opacity-70 [background:radial-gradient(circle_at_80%_24%,rgba(5,171,221,.2),transparent_28%)]" />
          <div className="relative flex items-center justify-between"><p className="eyebrow text-aqua">THE PROGRAM GATE · 001</p><span className="mono text-xs text-charcoal/35">12W / 48S</span></div>
          <div className="relative py-16 lg:py-24">
            <p className="font-display text-[clamp(4.5rem,11vw,10rem)] font-bold leading-[.72] tracking-[-.09em] text-charcoal">00<span className="text-sky">→</span>48</p>
            <h1 className="mt-9 max-w-[12ch] font-display text-[clamp(2.6rem,5vw,5.8rem)] font-bold leading-[.92] tracking-[-.065em]">{mm ? <>မနက်ဖြန်မဟုတ်ဘူး<br /><span className="text-aqua">ဒီနေ့ကစမယ်</span></> : <>NOT TOMORROW.<br /><span className="text-aqua">START TODAY.</span></>}</h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-charcoal/55" lang={mm ? "my" : "en"}>{mm ? "Baseline ကနေ Week 12 proof အထိ set တိုင်း၊ habit တိုင်း၊ ကိုယ့်အားထုတ်မှုတိုင်းကို တစ်နေရာတည်းမှာဆက်သွားမယ်" : "From baseline to Week 12 proof, carry every set, every habit and every honest effort in one continuous record."}</p>
          </div>
          <div className="relative grid grid-cols-3 border-y border-charcoal/15 py-4 text-center"><div><p className="mono text-xl font-bold">12</p><p className="eyebrow mt-1 text-charcoal/35">WEEKS</p></div><div className="border-x border-charcoal/15"><p className="mono text-xl font-bold">48</p><p className="eyebrow mt-1 text-charcoal/35">SESSIONS</p></div><div><p className="mono text-xl font-bold">01</p><p className="eyebrow mt-1 text-charcoal/35">BACKPACK</p></div></div>
        </section>

        <section className="flex items-center bg-white/78 px-4 py-12 sm:px-10 lg:px-14">
          <div className="mx-auto w-full max-w-md">
            <p className="eyebrow text-aqua">MEMBER ACCESS · LOGIN</p>
            <h2 className="mt-4 font-display text-5xl font-bold leading-[.92] tracking-[-.06em]">{mm ? "ကိုယ့် program ထဲ ဝင်မယ်" : "ENTER YOUR PROGRAM"}</h2>
            <p className="mt-5 text-sm leading-7 text-charcoal/52" lang={mm ? "my" : "en"}>{mm ? "Account အသစ်နဲ့လည်း ဒီကနေစနိုင်တယ်။ Payment confirm မဖြစ်သေးရင် ကိုယ့် reference နဲ့ လုပ်ရမယ့်အဆင့်ကို ဆက်ပြမယ်" : "The same doorway works for a new account. If payment is pending, your reference and next step will be waiting inside."}</p>

            <button type="button" onClick={signInWithGoogle} disabled={Boolean(loading)} className="mt-9 flex min-h-14 w-full items-center justify-between border border-charcoal bg-charcoal px-5 text-xs font-bold uppercase tracking-[.08em] text-white transition hover:bg-sky hover:text-charcoal disabled:opacity-60"><span>{mm ? "Google နဲ့ဆက်မယ်" : "Continue with Google"}</span>{loading === "google" ? <LoaderCircle className="animate-spin" size={17} /> : <span className="grid h-7 w-7 place-items-center border border-current font-display">G</span>}</button>
            <div className="my-6 flex items-center gap-4"><span className="h-px flex-1 bg-charcoal/15" /><span className="eyebrow text-charcoal/30">EMAIL</span><span className="h-px flex-1 bg-charcoal/15" /></div>
            <form onSubmit={sendMagicLink} className="space-y-3">
              <label htmlFor="email" className="eyebrow block text-charcoal/50">Your email</label>
              <div className="relative"><Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-aqua" /><input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="min-h-14 w-full border border-charcoal/20 bg-paper/55 pl-11 pr-4 outline-none transition focus:border-sky" /></div>
              <button type="submit" disabled={Boolean(loading)} className="primary-button w-full">{loading === "email" ? <LoaderCircle className="animate-spin" size={17} /> : null}{mm ? "Login link ပို့မယ်" : "Send secure login link"}</button>
            </form>
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="mx-auto mt-5 flex items-center gap-2 text-xs font-bold text-charcoal/42"><KeyRound size={14} />{mm ? "Owner password သုံးမယ်" : "Use owner password"}</button>
            {showPassword ? <div className="mt-4 space-y-3 border-l-2 border-sky bg-ice/55 p-4"><label htmlFor="password" className="eyebrow block text-charcoal/50">Password</label><input id="password" type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-13 w-full border border-charcoal/20 bg-white px-4 outline-none focus:border-sky" /><button type="button" onClick={signInWithPassword} disabled={Boolean(loading) || !email || password.length < 8} className="secondary-button w-full disabled:opacity-45">{loading === "password" ? <LoaderCircle className="animate-spin" size={17} /> : null}{mm ? "Password နဲ့ဝင်မယ်" : "Enter with password"}</button></div> : null}
            <p className="mt-8 text-center text-[11px] leading-6 text-charcoal/35">{mm ? "ဆက်ဝင်ခြင်းဖြင့် " : "By continuing, you accept the "}<Link href={`/${locale}/legal`} className="underline underline-offset-4">{mm ? "Terms နဲ့ Privacy Policy" : "Terms and Privacy Policy"}</Link>{mm ? " ကိုသဘောတူသည်" : "."}</p>
          </div>
        </section>
      </div>
    </main>
  );
}
