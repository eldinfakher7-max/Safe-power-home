'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Step 1: Request OTP | Step 2: Verify OTP | Step 3: Set New Password | Step 4: Success
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState('email'); // 'email' | 'phone'
  const [value, setValue] = useState('');
  const [captchaChallenge, setCaptchaChallenge] = useState(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  // Step 2 state
  const [otpCode, setOtpCode] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Step 3 state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [resetToken, setResetToken] = useState('');

  // General UX state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  useEffect(() => {
    fetchCaptcha();
  }, []);

  // Resend Timer Countdown
  useEffect(() => {
    let interval = null;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendTimer]);

  async function fetchCaptcha() {
    try {
      const res = await fetch('/api/auth/captcha');
      if (res.ok) {
        const data = await res.json();
        setCaptchaChallenge(data);
      }
    } catch (e) {}
  }

  // Password Strength Calculation
  function getPasswordStrength(pass) {
    if (!pass) return { label: '', score: 0, color: '#E5E7EB' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pass)) score++;

    if (score <= 2) return { label: 'Weak', score: 33, color: '#EF4444' };
    if (score <= 4) return { label: 'Medium', score: 66, color: '#F59E0B' };
    return { label: 'Strong', score: 100, color: '#10B981' };
  }

  const strength = getPasswordStrength(newPassword);

  // Handle Step 1: Send OTP
  async function handleSendOTP(e) {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method,
          value,
          captchaId: captchaChallenge?.captchaId,
          captchaAnswer: captchaAnswer
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setInfoMessage(data.message || 'If the information is associated with an account, a verification code will be sent.');
        setStep(2);
        setResendTimer(60);
        setCanResend(false);
      } else {
        setError(data.error || 'Failed to send verification code. Please try again.');
        fetchCaptcha();
      }
    } catch (err) {
      setError('Connection error. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  }

  // Handle Resend OTP
  async function handleResendOTP() {
    if (!canResend || loading) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, value }),
      });
      const data = await res.json();

      if (res.ok) {
        setInfoMessage('A new verification code has been sent.');
        setResendTimer(60);
        setCanResend(false);
        setOtpCode('');
      } else {
        setError(data.error || 'Failed to resend code.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Handle Step 2: Verify OTP
  async function handleVerifyOTP(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, value, code: otpCode }),
      });

      const data = await res.json();
      if (res.ok) {
        setResetToken(data.resetToken);
        setStep(3);
        setError('');
        setInfoMessage('');
      } else {
        setError(data.error || 'Invalid verification code.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Handle Step 3: Reset Password
  async function handleResetPassword(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetToken,
          newPassword,
          confirmPassword
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStep(4);
        setError('');
      } else {
        setError(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #C92A2A, #A61E1E)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 30px rgba(201,42,42,0.3)' }}>
            <i className="fa-solid fa-key" style={{ color: 'white', fontSize: 26 }} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--primary)', letterSpacing: -0.5 }}>
            {step === 4 ? 'Password Reset Complete' : 'Password Recovery'}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {step === 1 && 'Select a recovery method to receive a verification code.'}
            {step === 2 && 'Enter the 6-digit verification code sent to your account.'}
            {step === 3 && 'Create a strong new password for your account.'}
            {step === 4 && 'Your password has been successfully updated.'}
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div style={{ background: '#FEE2E2', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fa-solid fa-circle-exclamation" />
            {error}
          </div>
        )}

        {/* Global Info Banner */}
        {infoMessage && step !== 4 && (
          <div style={{ background: '#EFF6FF', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#1D4ED8', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fa-solid fa-circle-info" />
            {infoMessage}
          </div>
        )}

        {/* STEP 1: Select Method & Enter Details */}
        {step === 1 && (
          <form onSubmit={handleSendOTP}>
            {/* Method Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 18, background: 'var(--accent)', padding: 4, borderRadius: 10, border: '1px solid var(--border)' }}>
              <button
                type="button"
                onClick={() => { setMethod('email'); setValue(''); }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.2s ease',
                  background: method === 'email' ? 'var(--card-bg, #ffffff)' : 'transparent',
                  color: method === 'email' ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: method === 'email' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                <i className="fa-solid fa-envelope" style={{ marginRight: 6 }} />
                Email Address
              </button>
              <button
                type="button"
                onClick={() => { setMethod('phone'); setValue(''); }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.2s ease',
                  background: method === 'phone' ? 'var(--card-bg, #ffffff)' : 'transparent',
                  color: method === 'phone' ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: method === 'phone' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                <i className="fa-solid fa-phone" style={{ marginRight: 6 }} />
                Phone Number
              </button>
            </div>

            {/* Input Field */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                {method === 'email' ? 'Registered Email Address' : 'Registered Phone Number'}
              </label>
              <div style={{ position: 'relative' }}>
                <i className={`fa-solid ${method === 'email' ? 'fa-envelope' : 'fa-phone'}`} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14 }} />
                <input
                  type={method === 'email' ? 'email' : 'tel'}
                  className="form-input"
                  style={{ paddingLeft: 38 }}
                  placeholder={method === 'email' ? 'user@smartpowerhome.com' : 'e.g. +966500000000'}
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* CAPTCHA Challenge */}
            {captchaChallenge && (
              <div style={{ marginBottom: 20, padding: 12, background: 'var(--accent, rgba(0,0,0,0.03))', borderRadius: 10, border: '1px solid var(--border)' }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="fa-solid fa-shield-halved" style={{ color: 'var(--secondary, #C92A2A)' }} />
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
                    title="Refresh challenge"
                    style={{ padding: '8px 12px', fontSize: 12 }}
                  >
                    <i className="fa-solid fa-arrows-rotate" />
                  </button>
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, borderRadius: 12 }}>
              {loading ? (
                <><div className="spinner" style={{ width: 18, height: 18 }} /> Sending Code...</>
              ) : (
                <><i className="fa-solid fa-paper-plane" /> Send Verification Code</>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Verify OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>
                6-Digit Verification Code
              </label>
              <input
                type="text"
                className="form-input"
                style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: 700 }}
                placeholder="123456"
                maxLength={6}
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading || otpCode.length < 6} style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, borderRadius: 12, marginBottom: 16 }}>
              {loading ? (
                <><div className="spinner" style={{ width: 18, height: 18 }} /> Verifying...</>
              ) : (
                <><i className="fa-solid fa-shield-check" /> Verify Code</>
              )}
            </button>

            {/* Resend OTP Section */}
            <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  style={{ background: 'none', border: 'none', color: 'var(--secondary)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Resend Code
                </button>
              ) : (
                <span>Resend Code in <strong>{resendTimer}s</strong></span>
              )}
            </div>
          </form>
        )}

        {/* STEP 3: Create New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            {/* New Password */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <i className="fa-solid fa-lock" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14 }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: 38, paddingRight: 40 }}
                  placeholder="At least 8 chars, 1 uppercase, 1 number"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14 }}>
                  <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>

              {/* Password Strength Indicator */}
              {newPassword && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: strength.color, marginBottom: 4 }}>
                    <span>Password Strength:</span>
                    <span>{strength.label}</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${strength.score}%`, height: '100%', background: strength.color, transition: 'all 0.3s ease' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <i className="fa-solid fa-lock-check" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14 }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: 38 }}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, borderRadius: 12 }}>
              {loading ? (
                <><div className="spinner" style={{ width: 18, height: 18 }} /> Updating Password...</>
              ) : (
                <><i className="fa-solid fa-check-circle" /> Reset Password</>
              )}
            </button>
          </form>
        )}

        {/* STEP 4: Success View */}
        {step === 4 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#D1FAE5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>
              <i className="fa-solid fa-check" />
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 24, lineHeight: 1.5 }}>
              Your password has been changed successfully. You can now log in with your new password.
            </p>
            <Link href="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, borderRadius: 12, textDecoration: 'none' }}>
              <i className="fa-solid fa-arrow-right-to-bracket" /> Back to Login
            </Link>
          </div>
        )}

        {/* Footer Navigation Back to Login */}
        {step !== 4 && (
          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13 }}>
            <Link href="/login" style={{ color: 'var(--text-muted)', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <i className="fa-solid fa-arrow-left" /> Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
