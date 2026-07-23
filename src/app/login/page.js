'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', rememberMe: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'phone'

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('sph_token', data.token);
        localStorage.setItem('sph_user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        setError(data.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Connection error. Please check your network.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #1E3A8A, #4DA3FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 30px rgba(30,58,138,0.3)' }}>
            <i className="fa-solid fa-bolt" style={{ color: 'white', fontSize: 28 }} />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--primary)', letterSpacing: -0.5 }}>Smart Power Home</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>AI-Based Energy Management System</p>
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fa-solid fa-circle-exclamation" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          {/* Login Method Tab Selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, background: 'var(--accent)', padding: 4, borderRadius: 10, border: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => { setLoginMethod('email'); setForm(p => ({ ...p, email: '' })); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s ease',
                background: loginMethod === 'email' ? 'var(--card-bg, #ffffff)' : 'transparent',
                color: loginMethod === 'email' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: loginMethod === 'email' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              <i className="fa-solid fa-envelope" style={{ marginRight: 6 }} />
              Email Address
            </button>
            <button
              type="button"
              onClick={() => { setLoginMethod('phone'); setForm(p => ({ ...p, email: '' })); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s ease',
                background: loginMethod === 'phone' ? 'var(--card-bg, #ffffff)' : 'transparent',
                color: loginMethod === 'phone' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: loginMethod === 'phone' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              <i className="fa-solid fa-phone" style={{ marginRight: 6 }} />
              Phone Number
            </button>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
              {loginMethod === 'email' ? 'Email Address' : 'Phone Number'}
            </label>
            <div style={{ position: 'relative' }}>
              <i className={`fa-solid ${loginMethod === 'email' ? 'fa-envelope' : 'fa-phone'}`} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14 }} />
              <input
                type={loginMethod === 'email' ? 'email' : 'tel'}
                className="form-input"
                style={{ paddingLeft: 38 }}
                placeholder={loginMethod === 'email' ? 'admin@smartpowerhome.com' : 'e.g. +966500000000'}
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <i className="fa-solid fa-lock" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14 }} />
              <input
                type={showPass ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: 38, paddingRight: 40 }}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
              />
              <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14 }}>
                <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)' }}>
              <input type="checkbox" checked={form.rememberMe} onChange={e => setForm(p => ({ ...p, rememberMe: e.target.checked }))} style={{ accentColor: 'var(--primary)' }} />
              Remember me
            </label>
            <Link href="#" style={{ fontSize: 13, color: 'var(--secondary)', fontWeight: 600, textDecoration: 'none' }}>Forgot Password?</Link>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, borderRadius: 12 }}>
            {loading ? (
              <><div className="spinner" style={{ width: 18, height: 18 }} /> Signing in...</>
            ) : (
              <><i className="fa-solid fa-arrow-right-to-bracket" /> Sign In</>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13 }}>
          <span style={{ color: 'var(--text-muted)' }}>Don't have an account? </span>
          <Link href="/signup" style={{ color: 'var(--secondary)', fontWeight: 700, textDecoration: 'none' }}>Create Account</Link>
        </div>


      </div>
    </div>
  );
}
