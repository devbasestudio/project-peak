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
    <main className="grid min-h-screen bg-paper lg:grid-cols-[1fr_.86fr]">
      <section className="relative hidden overflow-hidden bg-charcoal p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:64px_64px]" />
        <Image src="/brand/logo-light.svg" alt="Project Peak" width={190} height={54} className="relative" />
        <div className="relative max-w-3xl">
          <p className="eyebrow text-sky">12 WEEKS · 48 SESSIONS</p>
          <h1 className="mt-6 font-display text-7xl font-bold leading-[.86] tracking-[-.07em]">
            {mm ? <>မနက်ဖြန်မဟုတ်ဘူး<br /><span className="text-sky">ဒီနေ့ကစမယ်</span></> : <>Not tomorrow.<br /><span className="text-sky">Start today.</span></>}
          </h1>
          <p className="mt-7 max-w-xl leading-8 text-white/55" lang={mm ? "my" : "en"}>
            {mm ? "Google account တစ်ခုနဲ့ baseline ကနေ Week 12 comparison အထိ ကိုယ့် progress အကုန်တစ်နေရာထဲမှာသိမ်းထားမယ်" : "One account keeps your baseline, every set, each habit and your Week 12 proof in one place."}
          </p>
        </div>
        <p className="relative mono text-xs text-white/28">KNOWLEDGE · HABITS · IDENTITY</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center justify-between">
            <Link href={`/${locale}`} className="flex items-center gap-2 text-sm font-semibold text-charcoal/55"><ArrowLeft size={16} />{mm ? "ပြန်မယ်" : "Back"}</Link>
            <Image src="/brand/icon-gradient.svg" width={38} height={38} alt="Project Peak" className="lg:hidden" />
            <Link href={`/${mm ? "en" : "mm"}/login?next=${encodeURIComponent(nextPath)}`} className="rounded-lg border border-charcoal/10 px-3 py-2 text-xs font-bold">{mm ? "EN" : "မြန်မာ"}</Link>
          </div>

          <p className="eyebrow text-aqua">MEMBER ACCESS</p>
          <h2 className="mt-4 font-display text-5xl font-bold tracking-[-.055em]">{mm ? "Program ထဲဝင်မယ်" : "Enter your program"}</h2>
          <p className="mt-4 leading-7 text-charcoal/55" lang={mm ? "my" : "en"}>{mm ? "Account အသစ်ဆိုလည်း ဒီကနေဝင်ရုံပဲ။ ဝယ်ယူမှု confirm မဖြစ်သေးရင် reference code နဲ့ payment instructions ကိုပြမယ်" : "New here? Use the same sign-in. If your purchase is not active yet, we will show your reference code and payment instructions."}</p>

          <button type="button" onClick={signInWithGoogle} disabled={Boolean(loading)} className="mt-8 flex min-h-13 w-full items-center justify-center gap-3 rounded-xl border border-charcoal/12 bg-white px-4 font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60">
            {loading === "google" ? <LoaderCircle className="animate-spin" size={18} /> : <span className="grid h-6 w-6 place-items-center rounded-full border border-charcoal/10 font-display text-sm font-bold">G</span>}
            {mm ? "Google နဲ့ဝင်မယ်" : "Continue with Google"}
          </button>

          <div className="my-6 flex items-center gap-4 text-xs text-charcoal/35"><span className="h-px flex-1 bg-charcoal/10" />{mm ? "သို့မဟုတ်" : "OR"}<span className="h-px flex-1 bg-charcoal/10" /></div>

          <form onSubmit={sendMagicLink} className="space-y-3">
            <label htmlFor="email" className="block text-sm font-bold">Email</label>
            <div className="relative">
              <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/35" />
              <input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="min-h-13 w-full rounded-xl border border-charcoal/12 bg-white pl-11 pr-4 outline-none transition focus:border-sky" />
            </div>
            <button type="submit" disabled={Boolean(loading)} className="primary-button w-full">
              {loading === "email" ? <LoaderCircle className="animate-spin" size={17} /> : null}{mm ? "Email login link ပို့မယ်" : "Email me a sign-in link"}
            </button>
          </form>
          <button type="button" onClick={() => setShowPassword((value) => !value)} className="mx-auto mt-4 flex items-center gap-2 text-xs font-semibold text-charcoal/42"><KeyRound size={14} />{mm ? "Admin password နဲ့ဝင်မယ်" : "Use admin password"}</button>
          {showPassword ? <div className="mt-4 space-y-3 rounded-xl border border-charcoal/10 bg-white/60 p-4">
            <label htmlFor="password" className="block text-sm font-bold">Password</label>
            <input id="password" type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-13 w-full rounded-xl border border-charcoal/12 bg-white px-4 outline-none transition focus:border-sky" />
            <button type="button" onClick={signInWithPassword} disabled={Boolean(loading) || !email || password.length < 8} className="secondary-button w-full disabled:opacity-45">{loading === "password" ? <LoaderCircle className="animate-spin" size={17} /> : null}{mm ? "Password နဲ့ဝင်မယ်" : "Sign in with password"}</button>
          </div> : null}
          <p className="mt-7 text-center text-xs leading-6 text-charcoal/38">{mm ? "ဝင်လိုက်တာနဲ့ " : "By continuing, you agree to the "}<Link href={`/${locale}/legal`} className="underline underline-offset-4">{mm ? "Terms နဲ့ Privacy Policy" : "Terms and Privacy Policy"}</Link>{mm ? " ကို သဘောတူတယ်လို့ သတ်မှတ်မယ်" : "."}</p>
        </div>
      </section>
    </main>
  );
}
