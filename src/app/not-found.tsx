import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center bg-paper p-5">
    <section className="relative w-full max-w-5xl overflow-hidden rounded-[2rem] bg-charcoal p-7 text-white sm:p-12">
      <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full border border-sky/25" />
      <div className="absolute -right-8 -top-8 h-52 w-52 rounded-full bg-sky/10" />
      <Image src="/brand/logo-light.svg" width={176} height={46} alt="Project Peak" />
      <div className="relative mt-24 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div><p className="font-mono text-[10px] font-bold tracking-[.2em] text-sky">ROUTE NOT FOUND · 404</p><h1 className="mt-5 max-w-[9ch] font-display text-6xl font-black leading-[.88] tracking-[-.075em] sm:text-8xl">WRONG TURN.<br /><span className="text-sky">KEEP MOVING.</span></h1><p className="mt-7 max-w-xl text-sm leading-7 text-white/58">ဒီစာမျက်နှာ မရှိတော့ပါဘူး။ Project Peak ရဲ့ အဓိကလမ်းကြောင်းကို ပြန်သွားပြီး နောက်တစ်ဆင့်ကို ဆက်လုပ်နိုင်ပါတယ်။</p></div>
        <span className="font-display text-[8rem] font-black leading-none text-white/[.06] sm:text-[12rem]">404</span>
      </div>
      <div className="relative mt-12 flex flex-wrap gap-3 border-t border-white/12 pt-6"><Link href="/mm" className="flex min-h-12 items-center gap-3 bg-sky px-5 text-sm font-bold text-charcoal"><Home size={16} />Home ကိုပြန်မယ်</Link><Link href="/mm/app" className="flex min-h-12 items-center gap-3 border border-white/15 px-5 text-sm font-bold text-white"><ArrowLeft size={16} />Program ထဲပြန်ဝင်မယ်</Link></div>
    </section>
  </main>;
}
