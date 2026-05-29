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
    <div className="admin-page">
      {/* Admin Navigation */}
      <nav className="admin-nav">
        <div className="admin-nav-brand">
          <i className="ph ph-barbell"></i>
          <span>Project Peak <span style={{ color: '#ff6b35' }}>空</span> Trainer</span>
        </div>
        <div className="admin-nav-links">
          <Link href="/admin/dashboard" className="admin-nav-link active">
            <i className="ph ph-users"></i> Clients
          </Link>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            }}
            className="admin-nav-link logout"
          >
            <i className="ph ph-sign-out"></i> Logout
          </button>
        </div>
      </nav>

      <div className="admin-container">
        
        {/* New Registrations Section */}
        <div className="admin-card admin-card-highlight" style={{ marginBottom: '2.5rem' }}>
          <h3 className="admin-section-title" style={{ fontSize: '1.2rem', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <i className="ph ph-user-plus" style={{ color: '#22c55e' }}></i> ပရိုဂရမ် အသစ်လျှောက်ထားသူများ
          </h3>
          
          {registrations.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>အသစ်လျှောက်ထားသူ မရှိသေးပါ။</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {registrations.map((reg) => (
                <div key={reg.id} className="admin-card" style={{ animation: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <h4 className="admin-client-name" style={{ margin: 0 }}>
                      {reg.name}{' '}
                      <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>
                        (Age: {reg.age} | Height: {reg.height} | Weight: {reg.weight} lbs)
                      </span>
                    </h4>
                    <span className="admin-badge admin-badge-reviewed">{reg.workout_split}</span>
                  </div>
                  
                  <div className="admin-reg-grid">
                    <div className="admin-reg-detail"><strong>Email:</strong> {reg.email}</div>
                    <div className="admin-reg-detail"><strong>Phone:</strong> {reg.phone}</div>
                    <div className="admin-reg-detail"><strong>Date:</strong> {new Date(reg.created_at).toLocaleDateString()}</div>
                  </div>
                  
                  <div className="admin-notes-box">
                    <strong><i className="ph ph-note"></i> ရည်မှန်းချက်:</strong>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{reg.notes}</p>
                  </div>

                  <div className="admin-photo-links">
                    {reg.photo_front && (
                      <a href={`/${reg.photo_front}`} target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn-secondary">
                        <i className="ph ph-image"></i> ရှေ့ပိုင်း
                      </a>
                    )}
                    {reg.photo_back && (
                      <a href={`/${reg.photo_back}`} target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn-secondary">
                        <i className="ph ph-image"></i> နောက်ပိုင်း
                      </a>
                    )}
                    {reg.photo_side && (
                      <a href={`/${reg.photo_side}`} target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn-secondary">
                        <i className="ph ph-image"></i> ဘေးပိုင်း
                      </a>
                    )}
                    {reg.payment_screenshot && (
                      <a href={`/${reg.payment_screenshot}`} target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn-success">
                        <i className="ph ph-receipt"></i> ပြေစာ
                      </a>
                    )}
                    {reg.user_id && (
                      <Link href={`/admin/client-view?id=${reg.user_id}`} className="admin-btn admin-btn-primary">
                        <i className="ph ph-user"></i> View Client
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Client Management */}
        <h2 className="admin-section-title">
          <i className="ph ph-users"></i> Client Management
        </h2>
        
        <div className="admin-client-grid" style={{ marginBottom: '3rem' }}>
          {clients.map((c) => (
            <Link key={c.id} href={`/admin/client-view?id=${c.id}`} className="admin-client-card">
              <h3 className="admin-client-name">{c.username}</h3>
              <p className="admin-client-meta">
                <i className="ph ph-envelope"></i> {c.email}
              </p>
              <p className="admin-client-meta">
                <i className="ph ph-calendar"></i> {c.duration_weeks || 12} Weeks Program
              </p>
            </Link>
          ))}
        </div>

        {/* Recent Check-ins */}
        <div className="admin-card">
          <h3 className="admin-section-title" style={{ fontSize: '1.2rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <i className="ph ph-clipboard-text" style={{ color: '#a855f7' }}></i> နောက်ဆုံးဝင်ထားသော Check-ins
          </h3>
          
          {recentCheckins.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>Check-in ဝင်ထားသူ မရှိသေးပါ။</p>
          ) : (
            <div>
              {recentCheckins.map((chk) => (
                <div key={chk.id} className="admin-checkin-row">
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                      {chk.username} - Week {chk.week_number}
                    </h4>
                    <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)' }}>
                      Submitted: {new Date(chk.created_at).toLocaleString()}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {chk.admin_feedback ? (
                      <span className="admin-badge admin-badge-reviewed">Reviewed</span>
                    ) : (
                      <span className="admin-badge admin-badge-pending">Needs Feedback</span>
                    )}
                    <Link href={`/admin/client-view?id=${chk.user_id}&week=${chk.week_number}`} className="admin-btn admin-btn-primary">
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
  );
}
