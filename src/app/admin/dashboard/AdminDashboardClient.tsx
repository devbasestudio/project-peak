"use client";

import React from 'react';
import Link from 'next/link';

interface AdminDashboardClientProps {
  clients: any[];
  recentCheckins: any[];
  registrations: any[];
}

export default function AdminDashboardClient({
  clients,
  recentCheckins,
  registrations,
}: AdminDashboardClientProps) {
  return (
    <>
      <nav className="navbar" style={{ position: 'relative', marginBottom: '2rem' }}>
        <div className="nav-brand">
          <i className="ph ph-barbell kanji"></i>
          <span>Project Peak (Trainer Panel)</span>
        </div>
        <div className="nav-links">
          <Link href="/admin/dashboard" className="active">
            <i className="ph ph-users"></i> Clients
          </Link>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            }}
            style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
          >
            <i className="ph ph-sign-out"></i> Logout
          </button>
        </div>
      </nav>

      <div className="container" style={{ paddingBottom: '4rem' }}>
        <div className="main-content" style={{ margin: 0, maxWidth: '100%' }}>
          
          {/* New Program Registrations Section */}
          <div className="glass-card mb-3" style={{ background: '#fff', border: '1px solid var(--glass-border)', borderColor: '#22c55e', padding: '2rem', borderRadius: '16px', boxShadow: 'var(--soft-shadow)', marginBottom: '2.5rem' }}>
            <h3 style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="ph ph-user-plus" style={{ color: '#22c55e', fontSize: '1.5rem' }}></i> ပရိုဂရမ် အသစ်လျှောက်ထားသူများ (New Program Registrations)
            </h3>
            
            {registrations.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>အသစ်လျှောက်ထားသူ မရှိသေးပါ။ (No new registrations yet.)</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {registrations.map((reg) => (
                  <div key={reg.id} style={{ background: 'rgba(248, 250, 252, 0.8)', border: '1px solid var(--glass-border)', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                      <h4 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: 0, fontWeight: 700 }}>
                        {reg.name}{' '}
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                          (Age: {reg.age} | Height: {reg.height} | Weight: {reg.weight} lbs)
                        </span>
                      </h4>
                      <span className="badge success" style={{ background: '#22c55e', color: '#fff', padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                        {reg.workout_split}
                      </span>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', margin: '1rem 0', fontSize: '0.95rem' }}>
                      <div><strong>Email:</strong> {reg.email}</div>
                      <div><strong>Phone:</strong> {reg.phone}</div>
                      <div><strong>Date:</strong> {new Date(reg.created_at).toLocaleDateString()}</div>
                    </div>
                    
                    <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                      <strong style={{ color: 'var(--accent-color)' }}><i className="ph ph-note"></i> ရည်မှန်းချက် / အကြောင်းရင်း (Reason for starting):</strong>
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{reg.notes}</p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {reg.photo_front && (
                        <a href={`/${reg.photo_front}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', textDecoration: 'none', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <i className="ph ph-image"></i> ရှေ့ပိုင်း (Front)
                        </a>
                      )}
                      {reg.photo_back && (
                        <a href={`/${reg.photo_back}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', textDecoration: 'none', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <i className="ph ph-image"></i> နောက်ပိုင်း (Back)
                        </a>
                      )}
                      {reg.photo_side && (
                        <a href={`/${reg.photo_side}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', textDecoration: 'none', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <i className="ph ph-image"></i> ဘေးပိုင်း (Side)
                        </a>
                      )}
                      {reg.payment_screenshot && (
                        <a href={`/${reg.payment_screenshot}`} target="_blank" rel="noopener noreferrer" className="btn btn-cta" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', textDecoration: 'none', background: '#10b981', color: '#fff', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <i className="ph ph-receipt"></i> ပြေစာ (Payment)
                        </a>
                      )}
                      {reg.user_id && (
                        <Link href={`/admin/client-view?id=${reg.user_id}`} className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', textDecoration: 'none', background: 'var(--btn-primary)', color: '#fff', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <i className="ph ph-user"></i> View Client Profile
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Client Management Grid */}
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="ph ph-users" style={{ color: '#0ea5e9' }}></i> Client Management
          </h2>
          
          <div className="grid-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            {clients.map((c) => (
              <Link key={c.id} href={`/admin/client-view?id=${c.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="client-card" style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--glass-border)', boxShadow: 'var(--soft-shadow)', transition: 'all 0.3s ease', cursor: 'pointer' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{c.username}</h3>
                  <p style={{ margin: '0.75rem 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <i className="ph ph-envelope"></i> {c.email}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <i className="ph ph-calendar"></i> {c.duration_weeks || 12} Weeks Program
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Recent Check-ins */}
          <div className="glass-card" style={{ background: '#fff', border: '1px solid var(--glass-border)', padding: '2rem', borderRadius: '16px', boxShadow: 'var(--soft-shadow)' }}>
            <h3 style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="ph ph-clipboard-text" style={{ color: '#a855f7', fontSize: '1.5rem' }}></i> နောက်ဆုံးဝင်ထားသော Check-ins (Recent Check-ins)
            </h3>
            
            {recentCheckins.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>Check-in ဝင်ထားသူ မရှိသေးပါ။ (No check-ins yet.)</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recentCheckins.map((chk) => (
                  <div key={chk.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', padding: '1.25rem 0', borderBottom: '1px solid #f1f5f9', gap: '1rem' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                        {chk.username} - Week {chk.week_number}
                      </h4>
                      <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Submitted: {new Date(chk.created_at).toLocaleString()}
                      </p>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {chk.admin_feedback ? (
                        <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                          Reviewed
                        </span>
                      ) : (
                        <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                          Needs Feedback
                        </span>
                      )}
                      <Link href={`/admin/client-view?id=${chk.user_id}&week=${chk.week_number}`} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', textDecoration: 'none', background: 'rgba(14, 165, 233, 0.08)', color: '#0ea5e9', border: 'none', borderRadius: '6px', fontWeight: 600 }}>
                        View & Feedback
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
