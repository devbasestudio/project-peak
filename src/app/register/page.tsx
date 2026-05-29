"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Validate inputs
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      let finalEmail = email.trim();

      // If it is a phone number (e.g. starting with 09), we suggest an email format since Supabase email signup expects standard emails
      if (!emailRegex.test(finalEmail)) {
        if (/^\d+$/.test(finalEmail)) {
          finalEmail = `${finalEmail}@projectpeak.local`;
        } else {
          setError('Email format မမှန်ကန်ပါ။ ကျေးဇူးပြု၍ ပြန်လည်စစ်ဆေးပေးပါ။');
          setSubmitting(false);
          return;
        }
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: finalEmail,
        password,
        options: {
          data: {
            username: username.trim(),
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else if (data.user) {
        // Redirect to setup profile or dashboard
        router.push('/user/dashboard');
        router.refresh();
      } else {
        setError('Signup ပြုလုပ်ရာတွင် အမှားအယွင်းရှိခဲ့ပါသည်။');
      }
    } catch {
      setError('ကွန်ရက် အမှားအယွင်း ဖြစ်ပေါ်နေပါသည်။ ကျေးဇူးပြု၍ ထပ်မံကြိုးစားကြည့်ပါ။');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-[var(--glass-border)] bg-white/50 px-[1.2rem] py-[0.8rem] text-[var(--text-main)] outline-none transition-all focus:border-[var(--accent-color)] focus:bg-white focus:shadow-[0_0_0_3px_rgba(14,165,233,0.1)]';

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#e0f2fe_0%,#f8fafc_100%)] p-8">
      <div className="w-full max-w-[400px] rounded-[20px] border border-[var(--glass-border)] bg-white p-12 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.01)]">
        <h2 className="mb-6 flex items-center gap-2 text-[2rem] font-bold text-[var(--text-main)]">
          <i className="ph ph-user-plus text-[var(--accent-color)]"></i> Register
        </h2>

        {error && (
          <p className="mb-4 rounded-lg bg-[#fef2f2] p-3 text-center text-sm font-medium text-[#ef4444]">
            {error}
          </p>
        )}

        <form onSubmit={handleRegister}>
          <div className="mb-5">
            <label className="mb-2 block font-semibold">Username (အမည်)</label>
            <input
              type="text"
              required
              placeholder="Alex"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="mb-5">
            <label className="mb-2 block font-semibold">Email / Phone (အီးမေးလ် သို့မဟုတ် ဖုန်း)</label>
            <input
              type="text"
              required
              placeholder="example@gmail.com / 09xxxxxxxxx"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="mb-6">
            <label className="mb-2 block font-semibold">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 flex -translate-y-1/2 cursor-pointer border-none bg-transparent text-xl text-[var(--text-muted)] transition-colors hover:text-[var(--accent-color)]"
              >
                <i className={`ph ${showPassword ? 'ph-eye' : 'ph-eye-slash'}`}></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full border-none bg-[linear-gradient(135deg,#0ea5e9,#38bdf8)] px-8 py-3 font-bold text-white shadow-[0_4px_15px_rgba(14,165,233,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(14,165,233,0.4)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <i className="ph ph-spinner ph-spin"></i> ဆောင်ရွက်နေပါသည်...
              </>
            ) : (
              <>
                <i className="ph ph-user-plus"></i> Member ဝင်မည်
              </>
            )}
          </button>

          <div className="mt-6 text-center">
            <a href="/login" className="text-sm text-[var(--text-muted)] no-underline transition-colors hover:text-[var(--accent-color)]">
              အကောင့်ရှိပြီးသားလား? Login ဝင်ရန်
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
