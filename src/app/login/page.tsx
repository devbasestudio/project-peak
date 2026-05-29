"use client";

import React, { useState } from 'react';
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
    <div className="auth-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '2.5rem', borderRadius: '24px', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.5)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)' }}>
        
        {/* Brand Icon */}
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255, 107, 53, 0.1)', color: '#ff6b35', marginBottom: '1.5rem' }}>
          <i className="ph ph-barbell" style={{ fontSize: '2rem' }}></i>
        </div>
        
        {/* Title */}
        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1c2b29', margin: '0 0 0.5rem 0' }}>
          Project Peak <span style={{ color: '#ff6b35' }}>空</span>
        </h2>
        <p style={{ color: '#83928f', fontSize: '0.95rem', margin: '0 0 2rem 0', lineHeight: '1.5', fontWeight: 500 }}>
          တောင်ထိပ်သို့ အရောက်လှမ်းရန် အဆင့်သင့်ဖြစ်ပြီလား? Google အကောင့်ဖြင့် ချက်ချင်းဝင်ရောက်ပါ။
        </p>

        {/* Error message if any */}
        {error && (
          <p style={{ color: '#ef4444', textAlign: 'center', marginBottom: '1.5rem', background: '#fef2f2', padding: '0.8rem', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid #fee2e2', fontWeight: 600 }}>
            {error}
          </p>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleSubmitting}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.8rem',
            padding: '1rem 1.5rem',
            borderRadius: '50px',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            background: '#ffffff',
            color: '#1c2b29',
            cursor: googleSubmitting ? 'not-allowed' : 'pointer',
            fontWeight: 700,
            fontSize: '1rem',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            outline: 'none',
          }}
          onMouseEnter={(e) => {
            if (!googleSubmitting) {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!googleSubmitting) {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.transform = 'none';
            }
          }}
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
      </div>
    </div>
  );
}
