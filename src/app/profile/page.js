'use client';
import { useState, useEffect } from 'react';
import LayoutWrapper from '@/components/LayoutWrapper';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('sph_token') : '';

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('sph_user') || '{}');
    setUser(u);
    setForm(p => ({ ...p, name: u.name || '', phone: u.phone || '' }));
  }, []);

  async function handleUpdate(e) {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPassword) {
      setMsg({ type: 'danger', text: 'Passwords do not match.' }); return;
    }
    setLoading(true);
    const body = { name: form.name, phone: form.phone };
    if (form.password) body.password = form.password;
    const res = await fetch('/api/profile/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    });
    setLoading(false);
    if (res.ok) {
      const updated = { ...user, name: form.name, phone: form.phone };
      localStorage.setItem('sph_user', JSON.stringify(updated));
      setUser(updated);
      setMsg({ type: 'success', text: 'Profile updated successfully!' });
      setForm(p => ({ ...p, password: '', confirmPassword: '' }));
    } else {
      setMsg({ type: 'danger', text: 'Update failed. Please try again.' });
    }
  }

  const stats = [
    { label: 'Account Type', value: user?.userType || 'User', icon: 'fa-id-badge', color: '#4DA3FF' },
    { label: 'Status', value: user?.status || 'Active', icon: 'fa-circle-check', color: '#10B981' },
    { label: 'Email', value: user?.email || '—', icon: 'fa-envelope', color: '#8B5CF6' },
    { label: 'Phone', value: user?.phone || '—', icon: 'fa-phone', color: '#F59E0B' },
  ];

  return (
    <LayoutWrapper pageTitle="My Profile">
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Profile Header */}
        <div className="chart-card" style={{ textAlign: 'center', marginBottom: 24, padding: '40px 32px' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #1E3A8A, #4DA3FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 30px rgba(30,58,138,0.25)', fontSize: 32, color: 'white', fontWeight: 900 }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <h2 style={{ fontWeight: 900, fontSize: 22, color: 'var(--primary)' }}>{user?.name}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{user?.email}</p>
          <div style={{ marginTop: 10 }}>
            <span style={{ background: 'rgba(30,58,138,0.1)', color: 'var(--primary)', padding: '4px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>{user?.userType}</span>
          </div>

          <div className="grid-4" style={{ marginTop: 28, gap: 16 }}>
            {stats.map(s => (
              <div key={s.label} style={{ background: 'var(--accent)', borderRadius: 12, padding: '14px 12px', border: '1px solid var(--border)' }}>
                <i className={`fa-solid ${s.icon}`} style={{ color: s.color, fontSize: 20, marginBottom: 8, display: 'block' }} />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>{s.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Edit Form */}
        <div className="chart-card">
          <h3 style={{ fontWeight: 800, fontSize: 16, color: 'var(--primary)', marginBottom: 20 }}>
            <i className="fa-solid fa-pen-to-square" style={{ marginRight: 8, color: 'var(--secondary)' }} />
            Edit Profile Information
          </h3>

          {msg && (
            <div style={{ background: msg.type === 'success' ? '#DCFCE7' : '#FEE2E2', border: `1px solid ${msg.type === 'success' ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.3)'}`, borderRadius: 10, padding: '10px 14px', fontSize: 13, color: msg.type === 'success' ? '#15803D' : '#DC2626', marginBottom: 20, display: 'flex', gap: 8 }}>
              <i className={`fa-solid ${msg.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`} />
              {msg.text}
            </div>
          )}

          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="grid-2">
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Full Name</label>
                <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Phone Number</label>
                <input className="form-input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)', marginBottom: 14 }}>
                <i className="fa-solid fa-lock" style={{ marginRight: 8 }} />Change Password (optional)
              </div>
              <div className="grid-2">
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>New Password</label>
                  <input type="password" className="form-input" placeholder="Leave empty to keep current" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Confirm Password</label>
                  <input type="password" className="form-input" placeholder="Repeat new password" value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} />
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ alignSelf: 'flex-start', padding: '11px 26px' }}>
              {loading ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Saving...</> : <><i className="fa-solid fa-floppy-disk" /> Save Changes</>}
            </button>
          </form>
        </div>
      </div>
    </LayoutWrapper>
  );
}
