"use client";

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleSubmitting(true);
    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (googleError) {
        setError(googleError.message);
        setGoogleSubmitting(false);
      }
    } catch {
      setError('Google Sign-In လုပ်ရာတွင် အမှားအယွင်းဖြစ်ပေါ်ခဲ့ပါသည်။');
      setGoogleSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#1c2b29_0%,#2a3f3c_50%,#1c2b29_100%)] p-8">
      {/* Animated background shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-[100px] -top-[100px] h-[400px] w-[400px] rounded-full bg-[#5f827d] opacity-[0.06] [animation:floatShape_20s_ease-in-out_infinite]" />
        <div className="absolute -bottom-[50px] -left-[80px] h-[300px] w-[300px] rounded-full bg-[#5f827d] opacity-[0.06] [animation:floatShape_25s_ease-in-out_infinite_reverse]" />
        <div className="absolute left-1/2 top-[40%] h-[200px] w-[200px] rounded-full bg-[#5f827d] opacity-[0.06] [animation:floatShape_18s_ease-in-out_infinite_5s]" />
      </div>

      <div className="relative z-[1] w-full max-w-[400px] rounded-[28px] border border-white/10 bg-white/5 p-10 text-center shadow-[0_25px_60px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-[24px] [animation:cardFadeUp_0.6s_cubic-bezier(0.16,1,0.3,1)]">
        {/* Brand Icon */}
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(255,107,53,0.15)] [animation:iconPulse_3s_ease-in-out_infinite]">
          <i className="ph ph-mountains text-[2rem] text-[#ff6b35]" />
        </div>

        {/* Title */}
        <h2 className="mb-2 text-[1.8rem] font-black text-white">
          Project Peak <span className="text-[#ff6b35]">空</span>
        </h2>
        <p className="mb-8 text-[0.95rem] font-medium leading-relaxed text-white/50">
          တောင်ထိပ်သို့ အရောက်လှမ်းရန် အဆင့်သင့်ဖြစ်ပြီလား?<br />
          Google အကောင့်ဖြင့် ချက်ချင်းဝင်ရောက်ပါ။
        </p>

        {/* Error message */}
        {error && (
          <p className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-sm font-semibold text-red-500 [animation:shake_0.4s_ease]">
            {error}
          </p>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleSubmitting}
          className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-full border border-white/10 bg-white/[0.08] px-6 py-4 text-base font-bold text-white outline-none transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/15 hover:shadow-[0_8px_25px_rgba(0,0,0,0.2)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {googleSubmitting ? (
            <i className="ph ph-spinner ph-spin text-xl" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" className="shrink-0">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.78 2.77-1.8 3.45l3.87 3c2.26-2.08 3.98-5.14 3.98-9.3z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.87-3c-1.08.72-2.45 1.16-4.09 1.16-3.14 0-5.8-2.11-6.75-4.96l-4 3.09C3.18 20.3 7.22 24 12 24z" />
              <path fill="#FBBC05" d="M5.25 14.29a7.19 7.19 0 010-4.58l-4-3.09A11.96 11.96 0 000 12c0 2.02.5 3.92 1.25 5.61l4-3.32z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.22 0 12 0 7.22 0 3.18 3.7 1.25 7.38l4 3.09c.95-2.85 3.61-4.96 6.75-4.96z" />
            </svg>
          )}
          {googleSubmitting ? 'ဆိုင်းအင်ဝင်နေပါသည်...' : 'Google အကောင့်ဖြင့် ဝင်မည်'}
        </button>

        {/* Footer */}
        <div className="mt-8 text-[0.78rem] font-semibold text-white/25">
          Powered by Project Peak 空
        </div>
      </div>
    </div>
  );
}
