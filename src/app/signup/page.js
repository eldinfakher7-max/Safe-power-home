'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    userType: 'User',
    adminSecretKey: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const ADMIN_SECRET = 'fakherkoky@2010';

  async function handleSignup(e) {
    e.preventDefault();
    setError('');
    
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (form.userType === 'Admin' && form.adminSecretKey !== ADMIN_SECRET) {
      setError('Incorrect Admin Secret Password. You cannot register as System Administrator.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess('Account created successfully! Redirecting to login...');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(data.error || 'Registration failed.');
      }
    } catch (err) {
      setError('Connection error. Please check your network.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #1E3A8A, #4DA3FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 8px 30px rgba(30,58,138,0.3)' }}>
            <i className="fa-solid fa-bolt" style={{ color: 'white', fontSize: 24 }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--primary)' }}>Create Account</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Join Smart Power Home AI Platform</p>
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
            <i className="fa-solid fa-circle-exclamation" /> {error}
          </div>
        )}

        {success && (
          <div style={{ background: '#DCFCE7', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#15803D', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
            <i className="fa-solid fa-circle-check" /> {success}
          </div>
        )}

        <form onSubmit={handleSignup}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Full Name</label>
              <input type="text" className="form-input" placeholder="John Doe" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Phone Number</label>
              <input type="tel" className="form-input" placeholder="+966 5XX XXX XXXX" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Email Address</label>
            <input type="email" className="form-input" placeholder="your@email.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Password</label>
              <input type={showPassword ? 'text' : 'password'} className="form-input" placeholder="••••••••" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Confirm Password</label>
              <input type={showPassword ? 'text' : 'password'} className="form-input" placeholder="••••••••" value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} required />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <input type="checkbox" id="show-pass" checked={showPassword} onChange={e => setShowPassword(e.target.checked)} style={{ cursor: 'pointer' }} />
            <label htmlFor="show-pass" style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>Show Passwords</label>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Account Type</label>
            <select className="form-input" value={form.userType} onChange={e => setForm(p => ({ ...p, userType: e.target.value }))}>
              <option value="User">Standard User</option>
              <option value="Admin">System Administrator</option>
            </select>
          </div>

          {/* Secret Admin Key Field */}
          {form.userType === 'Admin' && (
            <div style={{ marginBottom: 20, padding: 14, background: 'rgba(30,58,138,0.06)', borderRadius: 10, border: '1px solid rgba(30,58,138,0.2)' }}>
              <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary)', marginBottom: 6, display: 'block' }}>
                <i className="fa-solid fa-key" style={{ marginRight: 6, color: 'var(--secondary)' }} />
                Admin Secret Password
              </label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter admin authorization key..."
                value={form.adminSecretKey}
                onChange={e => setForm(p => ({ ...p, adminSecretKey: e.target.value }))}
                required
              />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                Secret authorization password is required to create a System Administrator account.
              </span>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, borderRadius: 12 }}>
            {loading ? (
              <><div className="spinner" style={{ width: 18, height: 18 }} /> Creating Account...</>
            ) : (
              <><i className="fa-solid fa-user-plus" /> Create Account</>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13 }}>
          <span style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
          <Link href="/login" style={{ color: 'var(--secondary)', fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
}
