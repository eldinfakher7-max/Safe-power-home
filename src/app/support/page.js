'use client';
import { useState, useEffect } from 'react';
import LayoutWrapper from '@/components/LayoutWrapper';

export default function SupportPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', deviceName: '', deviceType: '', category: 'Hardware Failure', priority: 'Medium', subject: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('sph_token') : '';

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('sph_user') || '{}');
    setForm(p => ({ ...p, name: u.name || '', email: u.email || '', phone: u.phone || '' }));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setSuccess(`Complaint submitted! Ticket ID: ${data.complaintId || 'Generated'}`);
      setForm(p => ({ ...p, deviceName: '', deviceType: '', subject: '', description: '', priority: 'Medium' }));
    } else {
      setError(data.error || 'Failed to submit complaint.');
    }
  }

  return (
    <LayoutWrapper pageTitle="Support Center">
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: 'linear-gradient(135deg, #1E3A8A, #4DA3FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 8px 30px rgba(30,58,138,0.2)' }}>
            <i className="fa-solid fa-headset" style={{ color: 'white', fontSize: 26 }} />
          </div>
          <h2 style={{ fontWeight: 800, fontSize: 22, color: 'var(--primary)' }}>Submit Support Ticket</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>Describe your issue. Our team will respond within 24 hours.</p>
        </div>

        {success && <div style={{ background: '#DCFCE7', border: '1px solid rgba(22,163,74,0.3)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#15803D', marginBottom: 20, display: 'flex', gap: 8 }}><i className="fa-solid fa-circle-check" style={{ marginTop: 2 }} /> {success}</div>}
        {error && <div style={{ background: '#FEE2E2', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#DC2626', marginBottom: 20, display: 'flex', gap: 8 }}><i className="fa-solid fa-circle-exclamation" style={{ marginTop: 2 }} /> {error}</div>}

        <div className="chart-card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="grid-2">
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Full Name</label>
                <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Email Address</label>
                <input type="email" className="form-input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Phone Number</label>
                <input className="form-input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Device Name (If applicable)</label>
                <input className="form-input" placeholder="e.g. Living Room AC" value={form.deviceName} onChange={e => setForm(p => ({ ...p, deviceName: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Category</label>
                <select className="form-input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {['Hardware Failure', 'AI Calibration', 'Power Transient Leakage', 'Billing / Tariff Dispute', 'Device Registration', 'Other'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Priority</label>
                <select className="form-input" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                  {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Complaint Subject *</label>
              <input className="form-input" placeholder="Brief summary of your issue" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} required />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Detailed Description *</label>
              <textarea className="form-input" rows="5" placeholder="Describe your issue in detail, including what happened, when it started, and what you have tried..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required style={{ resize: 'vertical' }} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ alignSelf: 'flex-end', padding: '12px 28px' }}>
              {loading ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Submitting...</> : <><i className="fa-solid fa-paper-plane" /> Submit Ticket</>}
            </button>
          </form>
        </div>

        {/* Info Cards */}
        <div className="grid-3" style={{ marginTop: 24 }}>
          {[
            { icon: 'fa-clock', title: 'Response Time', text: 'Standard tickets are answered within 24 hours.' },
            { icon: 'fa-phone', title: 'Emergency Line', text: 'For critical electrical faults, call +966-XX-XXXXXXX.' },
            { icon: 'fa-envelope', title: 'Email Support', text: 'support@smartpowerhome.com for additional queries.' },
          ].map(c => (
            <div key={c.title} style={{ background: 'var(--accent)', borderRadius: 12, padding: 16, border: '1px solid var(--border)' }}>
              <i className={`fa-solid ${c.icon}`} style={{ color: 'var(--secondary)', fontSize: 22, marginBottom: 10, display: 'block' }} />
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{c.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{c.text}</div>
            </div>
          ))}
        </div>
      </div>
    </LayoutWrapper>
  );
}
