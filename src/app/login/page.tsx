"use client";

import React, { useState } from 'react';
import Image from 'next/image';
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
    } catch (err) {
      setError('Google Sign-In လုပ်ရာတွင် အမှားအယွင်းဖြစ်ပေါ်ခဲ့ပါသည်။');
      setGoogleSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated background shapes */}
      <div className="login-bg-shapes">
        <div className="login-shape login-shape-1"></div>
        <div className="login-shape login-shape-2"></div>
        <div className="login-shape login-shape-3"></div>
      </div>

      <div className="login-card">
        {/* Brand Icon */}
        <div className="login-brand-icon">
          <i className="ph ph-mountains"></i>
        </div>

        {/* Title */}
        <h2 className="login-title">
          Project Peak <span className="kanji">空</span>
        </h2>
        <p className="login-subtitle">
          တောင်ထိပ်သို့ အရောက်လှမ်းရန် အဆင့်သင့်ဖြစ်ပြီလား?<br />
          Google အကောင့်ဖြင့် ချက်ချင်းဝင်ရောက်ပါ။
        </p>

        {/* Error message */}
        {error && (
          <p className="login-error">{error}</p>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleSubmitting}
          className="google-btn"
        >
          {googleSubmitting ? (
            <i className="ph ph-spinner ph-spin" style={{ fontSize: '1.2rem' }}></i>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.78 2.77-1.8 3.45l3.87 3c2.26-2.08 3.98-5.14 3.98-9.3z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.87-3c-1.08.72-2.45 1.16-4.09 1.16-3.14 0-5.8-2.11-6.75-4.96l-4 3.09C3.18 20.3 7.22 24 12 24z" />
              <path fill="#FBBC05" d="M5.25 14.29a7.19 7.19 0 010-4.58l-4-3.09A11.96 11.96 0 000 12c0 2.02.5 3.92 1.25 5.61l4-3.32z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.22 0 12 0 7.22 0 3.18 3.7 1.25 7.38l4 3.09c.95-2.85 3.61-4.96 6.75-4.96z" />
            </svg>
          )}
          {googleSubmitting ? 'ဆိုင်းအင်ဝင်နေပါသည်...' : 'Google အကောင့်ဖြင့် ဝင်မည်'}
        </button>

        {/* Footer */}
        <div className="login-footer">
          Powered by Project Peak 空
        </div>
      </div>
    </div>
  );
}
