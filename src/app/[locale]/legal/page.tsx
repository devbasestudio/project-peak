import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";

export default async function LegalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const mm = locale === "mm";
  return (
    <main lang={mm ? "my" : "en"} className="editorial-grid min-h-screen bg-paper px-4 py-6 text-charcoal sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1240px]">
        <header className="flex min-h-16 items-center justify-between border-b border-charcoal/15">
          <Link href={`/${locale}`}><Image src="/brand/logo-dark.svg" width={176} height={50} alt="Project Peak" /></Link>
          <Link className="secondary-button" href={`/${mm ? "en" : "mm"}/legal`}>{mm ? "EN" : "မြန်မာ"}</Link>
        </header>
        <article className="grid gap-12 py-14 lg:grid-cols-[.7fr_1.3fr] lg:py-24">
          <div className="lg:sticky lg:top-12 lg:self-start"><p className="eyebrow text-aqua">PROGRAM STANDARD · 004</p><h1 className="mt-5 max-w-[9ch] font-display text-5xl font-bold leading-[.92] tracking-[-.065em] sm:text-7xl">{mm ? "အသုံးပြုမှုဆိုင်ရာ မူဝါဒ" : "PROGRAM POLICIES"}</h1><p className="mono mt-8 text-xs text-charcoal/35">LAST UPDATED<br />30 AUGUST 2026</p></div>
          <div className="border-t border-charcoal/15" lang={mm ? "my" : "en"}>
            {[
              ["01", mm ? "ကျန်းမာရေးဆိုင်ရာ အသိပေးချက်" : "Health disclaimer", mm ? "Project Peak က ပညာပေး fitness program ဖြစ်ပြီး ဆေးဘက်ဆိုင်ရာ အကြံပြုချက်မဟုတ်ပါ။ ဒဏ်ရာ၊ နာတာရှည်ရောဂါ၊ ကိုယ်ဝန်ဆောင်မှု သို့မဟုတ် လေ့ကျင့်ရန်မသင့်သည့် အခြေအနေရှိပါက ဆရာဝန်နှင့်တိုင်ပင်ပါ။ နာကျင်မှု၊ မူးဝေမှု သို့မဟုတ် အသက်ရှူခက်ခဲမှုဖြစ်ပါက ချက်ချင်းရပ်ပါ။" : "Project Peak is an educational fitness program, not medical advice. Consult a qualified clinician before training if you have an injury, chronic condition, pregnancy, or any reason exercise may be unsafe. Stop immediately if you feel pain, dizziness, or unusual shortness of breath."],
              ["02", mm ? "Account နဲ့ program access" : "Account and program access", mm ? "ဝယ်ယူသူတစ်ဦးအတွက် account တစ်ခုနှင့် ကိုယ်ပိုင် program copy တစ်ခု သတ်မှတ်ပေးပါသည်။ Login နှင့် content ကို ပြန်လည်မျှဝေခြင်း၊ ရောင်းချခြင်း သို့မဟုတ် ကူးယူဖြန့်ဝေခြင်းမပြုရပါ။" : "Each purchase is licensed to one account and one personal program copy. Credentials and paid content may not be resold, shared, copied, or redistributed."],
              ["03", mm ? "Payment နဲ့ refund" : "Payment and refunds", mm ? "Payment ကို KPay screenshot နှင့် reference code ဖြင့် manual verify လုပ်ပါသည်။ Digital program access ဖွင့်ပြီးနောက် refund မပေးနိုင်ပါ။ Payment မှားယွင်းမှုရှိပါက access မဖွင့်မီ @wayneax21 သို့ဆက်သွယ်ပါ။" : "KPay payments are verified manually using the screenshot and purchase reference. Because this is digital content, purchases are non-refundable after access is activated. Contact @wayneax21 before activation if a payment was made in error."],
              ["04", "Privacy", mm ? "Login အတွက် email/profile အချက်အလက်၊ purchase status၊ baseline၊ workout logs နှင့် habits ကို program လုပ်ဆောင်ချက်ပေးရန် သိမ်းဆည်းပါသည်။ Data ကို third-party advertising အတွက် မရောင်းချပါ။ Account/data ဖျက်လိုပါက @wayneax21 သို့ဆက်သွယ်နိုင်ပါသည်။" : "We store account identity, purchase status, baseline results, workout logs, and habits only to operate your program. We do not sell this data for third-party advertising. Contact @wayneax21 to request account or data deletion."],
            ].map(([number, title, body]) => <section className="grid gap-4 border-b border-charcoal/15 py-8 sm:grid-cols-[70px_1fr]" key={number}><span className="mono text-sm text-aqua">{number}</span><div><h2 className="font-display text-2xl font-bold tracking-[-.035em]">{title}</h2><p className="mt-4 max-w-2xl leading-8 text-charcoal/58">{body}</p></div></section>)}
          </div>
        </article>
      </div>
    </main>
  );
}
