"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      let finalEmail = email.trim();
      
      // Phone number fallback
      if (!emailRegex.test(finalEmail) && /^\d+$/.test(finalEmail)) {
        finalEmail = `${finalEmail}@projectpeak.local`;
      }

      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: finalEmail,
        password,
      });

      if (loginError) {
        setError(loginError.message === 'Invalid login credentials' ? 'Email သို့မဟုတ် Password မှားယွင်းနေပါသည်။' : loginError.message);
      } else if (data.user) {
        // Fetch user profile to redirect based on role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profile && profile.role === 'admin') {
          router.push('/admin/dashboard');
        } else if (data.user.email === 'admin@projectpeak.com') {
          router.push('/admin/dashboard');
        } else {
          router.push('/user/dashboard');
        }
        router.refresh();
      }
    } catch (err) {
      setError('ကွန်ရက် အမှားအယွင်း ဖြစ်ပေါ်နေပါသည်။ ကျေးဇူးပြု၍ ထပ်မံကြိုးစားကြည့်ပါ။');
    } finally {
      setSubmitting(false);
    }
  };

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
    <div className="auth-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <i className="ph ph-sign-in"></i> Login
        </h2>
        {error && (
          <p style={{ color: '#ef4444', textAlign: 'center', marginBottom: '1rem', background: '#fef2f2', padding: '0.8rem', borderRadius: '8px', fontSize: '0.9rem' }}>
            {error}
          </p>
        )}
        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Email Address / Phone</label>
            <input
              type="text"
              required
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '0.8rem 1.2rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.5)' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Password</label>
            <div className="password-wrapper" style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '0.8rem 3rem 0.8rem 1.2rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.5)' }}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <i className={`ph ${showPassword ? 'ph-eye' : 'ph-eye-slash'}`}></i>
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-cta"
            disabled={submitting || googleSubmitting}
            style={{ width: '100%', background: 'var(--btn-primary)', color: '#fff', padding: '0.8rem 2rem', borderRadius: '50px', fontWeight: 700, cursor: 'pointer', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}
          >
            {submitting ? (
              <>
                <i className="ph ph-spinner ph-spin"></i> ဆောင်ရွက်နေပါသည်...
              </>
            ) : (
              <>
                <i className="ph ph-sign-in"></i> Login ဝင်မည်
              </>
            )}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: 'var(--text-muted)' }}>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--glass-border)' }} />
          <span style={{ padding: '0 1rem', fontSize: '0.9rem' }}>သို့မဟုတ်</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--glass-border)' }} />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={submitting || googleSubmitting}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', padding: '0.8rem 1.2rem', borderRadius: '50px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontWeight: 600, transition: 'background-color 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
        >
          {googleSubmitting ? (
            <i className="ph ph-spinner ph-spin"></i>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.1.14 1.14 2.97-1.14 2.97H23.745z" style={{ display: 'none' }} />
              <path fill="#EA4335" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.87-3c-1.08.72-2.45 1.16-4.09 1.16-3.14 0-5.8-2.11-6.75-4.96l-4 3.09C3.18 20.3 7.22 24 12 24z" />
              <path fill="#FBBC05" d="M5.25 14.29a7.19 7.19 0 010-4.58l-4-3.09A11.96 11.96 0 000 12c0 2.02.5 3.92 1.25 5.61l4-3.32z" />
              <path fill="#34A853" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.22 0 12 0 7.22 0 3.18 3.7 1.25 7.38l4 3.09c.95-2.85 3.61-4.96 6.75-4.96z" />
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.78 2.77-1.8 3.45l3.87 3c2.26-2.08 3.98-5.14 3.98-9.3z" />
            </svg>
          )}
          Google အကောင့်ဖြင့် ဝင်မည်
        </button>

        <div className="text-center" style={{ marginTop: '1.5rem' }}>
          <a href="/register" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
            အကောင့်မရှိသေးဘူးလား? Register လုပ်ရန်
          </a>
        </div>
      </div>
    </div>
  );
}
