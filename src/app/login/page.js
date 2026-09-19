'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', rememberMe: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'phone'
  const [captchaChallenge, setCaptchaChallenge] = useState(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  useEffect(() => {
    fetchCaptcha();
  }, []);

  async function fetchCaptcha() {
    try {
      const res = await fetch('/api/auth/captcha');
      if (res.ok) {
        const data = await res.json();
        setCaptchaChallenge(data);
      }
    } catch (e) {}
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          captchaId: captchaChallenge?.captchaId,
          captchaAnswer: captchaAnswer
        }),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('sph_token', data.token);
        localStorage.setItem('sph_user', JSON.stringify(data.user));
        if (data.user?.mustChangePassword) {
          setMustChangeModal(true);
          setPendingToken(data.token);
          setPendingUser(data.user);
          setLoading(false);
          return;
        }

        if (data.user?.isAIAuthorized) {
          router.push('/chat');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(data.error || 'Login failed. Please try again.');
        fetchCaptcha();
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Connection error. Please check your network.');
    } finally {
      setLoading(false);
    }
  }

  const [mustChangeModal, setMustChangeModal] = useState(false);
  const [pendingToken, setPendingToken] = useState('');
  const [pendingUser, setPendingUser] = useState(null);
  const [newPassForm, setNewPassForm] = useState({ newPassword: '', confirmPassword: '' });
  const [changePassError, setChangePassError] = useState('');
  const [changePassLoading, setChangePassLoading] = useState(false);

  async function handleMustChangePassword(e) {
    e.preventDefault();
    if (newPassForm.newPassword !== newPassForm.confirmPassword) {
      setChangePassError('Passwords do not match.');
      return;
    }
    setChangePassLoading(true);
    setChangePassError('');

    try {
      const res = await fetch('/api/auth/update-must-change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pendingToken}`
        },
        body: JSON.stringify(newPassForm),
      });

      const data = await res.json();
      if (res.ok) {
        const updatedUser = { ...pendingUser, mustChangePassword: false };
        localStorage.setItem('sph_token', pendingToken);
        localStorage.setItem('sph_user', JSON.stringify(updatedUser));
        setMustChangeModal(false);
        if (updatedUser.isAIAuthorized) {
          router.push('/chat');
        } else {
          router.push('/dashboard');
        }
      } else {
        setChangePassError(data.error || 'Failed to update password.');
      }
    } catch (err) {
      setChangePassError('Connection error. Please try again.');
    } finally {
      setChangePassLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #C92A2A, #A61E1E)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 30px rgba(201,42,42,0.3)' }}>
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
            <Link
              href="/forgot-password"
              onClick={(e) => {
                e.preventDefault();
                router.push('/forgot-password');
              }}
              style={{ fontSize: 13, color: 'var(--secondary)', fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }}
            >
              Forgot Password?
            </Link>
          </div>

          {/* Security CAPTCHA Challenge */}
          {captchaChallenge && (
            <div style={{ marginBottom: 20, padding: 12, background: '#EFF6FF', borderRadius: 10, border: '1px solid #BFDBFE' }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#1E40AF', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="fa-solid fa-shield-halved" style={{ color: '#2563EB' }} />
                <span>{captchaChallenge.question}</span>
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Enter answer..."
                  value={captchaAnswer}
                  onChange={e => setCaptchaAnswer(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={fetchCaptcha}
                  className="btn btn-outline"
                  title="Refresh security challenge"
                  style={{ padding: '8px 12px', fontSize: 12 }}
                >
                  <i className="fa-solid fa-arrows-rotate" />
                </button>
              </div>
            </div>
          )}

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

      {/* Must Change Password Modal */}
      {mustChangeModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border)', borderRadius: 16, width: '100%', maxWidth: 440, padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 22 }}>
                <i className="fa-solid fa-shield-exclamation" />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)', margin: 0 }}>Password Change Required</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                You logged in with a temporary password. You must set a new password before continuing.
              </p>
            </div>

            {changePassError && (
              <div style={{ background: '#FEE2E2', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#DC2626', marginBottom: 16 }}>
                {changePassError}
              </div>
            )}

            <form onSubmit={handleMustChangePassword}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="At least 8 chars, 1 uppercase, 1 number"
                  value={newPassForm.newPassword}
                  onChange={e => setNewPassForm(p => ({ ...p, newPassword: e.target.value }))}
                  required
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Re-enter new password"
                  value={newPassForm.confirmPassword}
                  onChange={e => setNewPassForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={changePassLoading} style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', borderRadius: 10 }}>
                {changePassLoading ? 'Updating Password...' : 'Save New Password & Continue'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
