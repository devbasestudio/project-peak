"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Successful registration redirects to dashboard
        router.push('/user/dashboard');
        router.refresh();
      } else {
        setError(data.error || 'Registration လုပ်ရာတွင် အမှားအယွင်းဖြစ်ပေါ်ခဲ့ပါသည်။');
      }
    } catch (err) {
      setError('ကွန်ရက် အမှားအယွင်း ဖြစ်ပေါ်နေပါသည်။ ကျေးဇူးပြု၍ ထပ်မံကြိုးစားကြည့်ပါ။');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <i className="ph ph-user-plus"></i> Register
        </h2>
        {error && (
          <p style={{ color: '#ef4444', textAlign: 'center', marginBottom: '1rem', background: '#fef2f2', padding: '0.8rem', borderRadius: '8px', fontSize: '0.9rem' }}>
            {error}
          </p>
        )}
        <form onSubmit={handleRegister}>
          <div className="form-group" style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Username (အမည်)</label>
            <input
              type="text"
              required
              placeholder="Alex"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%', padding: '0.8rem 1.2rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.5)' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Email / Phone (အီးမေးလ် သို့မဟုတ် ဖုန်း)</label>
            <input
              type="text"
              required
              placeholder="example@gmail.com / 09xxxxxxxxx"
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
            disabled={submitting}
            style={{ width: '100%', background: 'var(--btn-primary)', color: '#fff', padding: '0.8rem 2rem', borderRadius: '50px', fontWeight: 700, cursor: 'pointer', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
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
          <div className="text-center" style={{ marginTop: '1.5rem' }}>
            <a href="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
              အကောင့်ရှိပြီးသားလား? Login ဝင်ရန်
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
