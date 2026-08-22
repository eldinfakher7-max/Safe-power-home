'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoState, setDemoState] = useState({
    watts: 2200,
    maxHours: 8,
    temp: 24,
    isOn: true,
    hoursUsed: 2.5
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('sph_token');
      const userData = localStorage.getItem('sph_user');
      if (token) {
        setIsLoggedIn(true);
        if (userData) {
          try {
            setUser(JSON.parse(userData));
          } catch (e) {
            console.error('Failed to parse user data:', e);
          }
        }
      }
    }
  }, []);

  const handleNavClick = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: "var(--font-inter), 'Inter', system-ui, sans-serif" }}>
      
      {/* ─────────────────────────────────────────────────────────────
          NAVBAR
      ───────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 4px 20px rgba(30, 58, 138, 0.05)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Brand Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #C92A2A 0%, #A61E1E 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(201, 42, 42, 0.3)'
            }}>
              <i className="fa-solid fa-shield-halved" style={{ fontSize: '20px' }} />
            </div>
            <div>
              <span style={{ fontWeight: 900, fontSize: '18px', letterSpacing: '-0.5px', color: 'var(--primary)', display: 'block', lineHeight: 1.1 }}>
                Safe Power Home
              </span>
              <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--brand-red)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                AI Energy Protection
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }} className="desktop-nav-links">
            <button onClick={() => handleNavClick('hero')} style={{ background: 'none', border: 'none', color: 'var(--text)', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'var(--transition)' }}>
              Home
            </button>
            <button onClick={() => handleNavClick('how-it-works')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'var(--transition)' }}>
              How It Works
            </button>
            <button onClick={() => handleNavClick('features')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'var(--transition)' }}>
              Features
            </button>
            <button onClick={() => handleNavClick('analysis')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'var(--transition)' }}>
              Smart Analysis
            </button>
            <button onClick={() => handleNavClick('safety')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'var(--transition)' }}>
              Safety
            </button>
            <button onClick={() => handleNavClick('about')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'var(--transition)' }}>
              About
            </button>
          </div>

          {/* Right Side Authentication Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="desktop-nav-auth">
            {isLoggedIn ? (
              <Link href={user?.isAIAuthorized ? "/chat" : "/dashboard"} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #C92A2A 0%, #A61E1E 100%)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '14px',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(201, 42, 42, 0.25)',
                transition: 'var(--transition)'
              }}>
                <i className={`fa-solid ${user?.isAIAuthorized ? 'fa-robot' : 'fa-chart-pie'}`} />
                <span>{user?.isAIAuthorized ? 'Safe Power AI Chat' : 'My Dashboard'}</span>
                {user && <span style={{ fontSize: '11px', opacity: 0.8, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '99px' }}>{user.name || 'User'}</span>}
              </Link>
            ) : (
              <>
                <Link href="/login" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  background: 'transparent',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  fontSize: '14px',
                  textDecoration: 'none',
                  border: '1px solid var(--border)',
                  transition: 'var(--transition)'
                }}>
                  Login
                </Link>

                <Link href="/signup" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 22px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #C92A2A 0%, #A61E1E 100%)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '14px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 16px rgba(201, 42, 42, 0.35)',
                  transition: 'var(--transition)'
                }}>
                  <span>Sign Up</span>
                  <i className="fa-solid fa-arrow-right" style={{ fontSize: '12px' }} />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              fontSize: '22px',
              color: 'var(--primary)',
              cursor: 'pointer',
              padding: '8px'
            }}
            className="mobile-hamburger-btn"
          >
            <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'}`} />
          </button>
        </div>

        {/* Mobile Slide-down Navigation Menu */}
        {mobileMenuOpen && (
          <div style={{
            background: 'var(--card)',
            borderBottom: '1px solid var(--border)',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <button onClick={() => handleNavClick('hero')} style={{ textAlign: 'left', background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: '15px' }}>
              Home
            </button>
            <button onClick={() => handleNavClick('how-it-works')} style={{ textAlign: 'left', background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 600, fontSize: '15px' }}>
              How It Works
            </button>
            <button onClick={() => handleNavClick('features')} style={{ textAlign: 'left', background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 600, fontSize: '15px' }}>
              Features
            </button>
            <button onClick={() => handleNavClick('analysis')} style={{ textAlign: 'left', background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 600, fontSize: '15px' }}>
              Smart Analysis
            </button>
            <button onClick={() => handleNavClick('safety')} style={{ textAlign: 'left', background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 600, fontSize: '15px' }}>
              Safety
            </button>
            <button onClick={() => handleNavClick('about')} style={{ textAlign: 'left', background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 600, fontSize: '15px' }}>
              About
            </button>

            <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {isLoggedIn ? (
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} style={{
                  textAlign: 'center',
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'var(--primary)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  textDecoration: 'none'
                }}>
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} style={{
                    textAlign: 'center',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    color: 'var(--primary)',
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}>
                    Login
                  </Link>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)} style={{
                    textAlign: 'center',
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'var(--primary)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}>
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ─────────────────────────────────────────────────────────────
          HERO SECTION
      ───────────────────────────────────────────────────────────── */}
      <section id="hero" style={{ padding: '80px 24px 60px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '48px', alignItems: 'center' }}>
          
          {/* Left Column: Hero Text */}
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '99px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              color: 'var(--primary)',
              fontSize: '13px',
              fontWeight: 700,
              marginBottom: '24px'
            }}>
              <i className="fa-solid fa-bolt" style={{ color: '#F59E0B' }} />
              <span>AI-Powered Home Energy & Safety Guard</span>
            </div>

            <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 900, lineHeight: 1.15, color: 'var(--primary)', marginBottom: '20px', letterSpacing: '-1px' }}>
              Protect Your Home. <br />
              <span style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Optimize Your Energy.
              </span>
            </h1>

            <p style={{ fontSize: '16px', lineHeight: 1.6, color: 'var(--text-muted)', marginBottom: '32px', maxWidth: '520px' }}>
              Real-time wattage tracking, automated emergency overload shutdown, and intelligent AI predictions to safeguard your appliances and reduce your monthly electricity bills.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
              {isLoggedIn ? (
                <Link href="/dashboard" style={{
                  padding: '14px 32px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #C92A2A 0%, #A61E1E 100%)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '16px',
                  textDecoration: 'none',
                  boxShadow: '0 8px 24px rgba(201, 42, 42, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <i className="fa-solid fa-gauge-high" />
                  <span>Go to My Dashboard</span>
                </Link>
              ) : (
                <Link href="/signup" style={{
                  padding: '14px 32px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #C92A2A 0%, #A61E1E 100%)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '16px',
                  textDecoration: 'none',
                  boxShadow: '0 8px 24px rgba(201, 42, 42, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span>Get Started Free</span>
                  <i className="fa-solid fa-arrow-right" />
                </Link>
              )}

              <button onClick={() => handleNavClick('features')} style={{
                padding: '14px 28px',
                borderRadius: '14px',
                background: 'var(--card)',
                color: 'var(--primary)',
                fontWeight: 700,
                fontSize: '15px',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="fa-solid fa-play" style={{ fontSize: '12px', color: 'var(--secondary)' }} />
                <span>Explore Features</span>
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Live Demo Appliance Card */}
          <div style={{ position: 'relative' }}>
            <div style={{
              background: 'var(--card)',
              borderRadius: '24px',
              padding: '28px',
              border: '1px solid var(--border)',
              boxShadow: '0 20px 50px rgba(30, 58, 138, 0.12)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: demoState.isOn ? 'rgba(16, 185, 129, 0.12)' : 'rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <i className="fa-solid fa-wind" style={{ fontSize: '22px', color: demoState.isOn ? 'var(--success)' : 'var(--text-muted)' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--primary)' }}>Living Room Air Conditioner</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Smart AC &bull; Main Living Area</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '99px',
                    fontSize: '11px',
                    fontWeight: 800,
                    background: demoState.isOn ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0,0,0,0.08)',
                    color: demoState.isOn ? '#10B981' : 'var(--text-muted)'
                  }}>
                    {demoState.isOn ? '● ON' : '○ OFF'}
                  </span>
                  <button
                    onClick={() => setDemoState(p => ({ ...p, isOn: !p.isOn }))}
                    style={{
                      width: '44px',
                      height: '24px',
                      borderRadius: '99px',
                      background: demoState.isOn ? '#10B981' : '#CBD5E1',
                      border: 'none',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'var(--transition)'
                    }}
                  >
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      position: 'absolute',
                      top: '3px',
                      left: demoState.isOn ? '23px' : '3px',
                      transition: 'var(--transition)'
                    }} />
                  </button>
                </div>
              </div>

              {/* Interactive Quick Metrics Control */}
              <div style={{ background: 'rgba(243, 244, 246, 0.8)', borderRadius: '16px', padding: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-bolt" style={{ color: '#F59E0B' }} /> Power Rating (Watts):
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => setDemoState(p => ({ ...p, watts: Math.max(500, p.watts - 100) }))} style={{ width: '26px', height: '26px', borderRadius: '8px', border: 'none', background: '#FFFFFF', color: '#1E293B', fontWeight: 800, cursor: 'pointer' }}>-</button>
                    <span style={{ fontWeight: 800, color: '#1E293B', minWidth: '60px', textAlign: 'center' }}>{demoState.watts}W</span>
                    <button onClick={() => setDemoState(p => ({ ...p, watts: p.watts + 100 }))} style={{ width: '26px', height: '26px', borderRadius: '8px', border: 'none', background: '#FFFFFF', color: '#1E293B', fontWeight: 800, cursor: 'pointer' }}>+</button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-regular fa-clock" style={{ color: '#3B82F6' }} /> Max Operating Hours:
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => setDemoState(p => ({ ...p, maxHours: Math.max(1, p.maxHours - 1) }))} style={{ width: '26px', height: '26px', borderRadius: '8px', border: 'none', background: '#FFFFFF', color: '#1E293B', fontWeight: 800, cursor: 'pointer' }}>-</button>
                    <span style={{ fontWeight: 800, color: '#1E293B', minWidth: '60px', textAlign: 'center' }}>{demoState.maxHours} hrs</span>
                    <button onClick={() => setDemoState(p => ({ ...p, maxHours: p.maxHours + 1 }))} style={{ width: '26px', height: '26px', borderRadius: '8px', border: 'none', background: '#FFFFFF', color: '#1E293B', fontWeight: 800, cursor: 'pointer' }}>+</button>
                  </div>
                </div>
              </div>

              {/* Progress Gauge */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', fontWeight: 700 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Daily Usage vs Safety Limit</span>
                  <span style={{ color: demoState.hoursUsed >= demoState.maxHours ? 'var(--danger)' : 'var(--success)' }}>
                    {demoState.hoursUsed} / {demoState.maxHours} hrs
                  </span>
                </div>
                <div style={{ height: '8px', borderRadius: '99px', background: '#E2E8F0', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min((demoState.hoursUsed / demoState.maxHours) * 100, 100)}%`,
                    background: demoState.hoursUsed >= demoState.maxHours ? 'var(--danger)' : 'var(--success)',
                    borderRadius: '99px',
                    transition: 'var(--transition)'
                  }} />
                </div>
              </div>

              {/* AI Shielded Badge */}
              <div style={{ marginTop: '20px', padding: '12px 16px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fa-solid fa-shield-cat" style={{ color: '#10B981', fontSize: '18px' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#065F46' }}>
                  AI Overload Protection Active &bull; Emergency Shutdown Standby
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          STATS BANNER
      ───────────────────────────────────────────────────────────── */}
      <section style={{ background: 'var(--card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '36px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '36px', fontWeight: 900, color: 'var(--primary)' }}>99.9%</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>System Protection Uptime</div>
          </div>
          <div>
            <div style={{ fontSize: '36px', fontWeight: 900, color: 'var(--secondary)' }}>&lt; 3 Secs</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Real-Time Alert Dispatch</div>
          </div>
          <div>
            <div style={{ fontSize: '36px', fontWeight: 900, color: 'var(--success)' }}>100%</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Automated Overload Prevention</div>
          </div>
          <div>
            <div style={{ fontSize: '36px', fontWeight: 900, color: 'var(--warning)' }}>0%</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Wasted Power & Energy</div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          HOW IT WORKS
      ───────────────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--secondary)', letterSpacing: '1px', textTransform: 'uppercase' }}>Simple & Intelligent</span>
          <h2 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--primary)', marginTop: '8px' }}>How Safe Power Home AI Works</h2>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginTop: '8px', maxWidth: '600px', marginInLine: 'auto' }}>
            Three effortless steps to secure your electrical infrastructure and automate home energy management.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
          
          <div style={{ background: 'var(--card)', padding: '32px', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 900, marginBottom: '20px' }}>
              1
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)', marginBottom: '12px' }}>Connect & Set Parameters</h3>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)' }}>
              Register your appliances with maximum operating hours, wattage limits, and security passcodes.
            </p>
          </div>

          <div style={{ background: 'var(--card)', padding: '32px', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(6, 182, 212, 0.1)', color: '#06B6D4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 900, marginBottom: '20px' }}>
              2
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)', marginBottom: '12px' }}>Continuous AI Telemetry</h3>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)' }}>
              Our AI engine monitors current draw, total kWh consumption, and active operating hours in real-time.
            </p>
          </div>

          <div style={{ background: 'var(--card)', padding: '32px', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 900, marginBottom: '20px' }}>
              3
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)', marginBottom: '12px' }}>Instant Overload Shutdown</h3>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)' }}>
              When limits are reached, the system triggers instant alerts and safely turns off the device to prevent hazards.
            </p>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          FEATURES GRID
      ───────────────────────────────────────────────────────────── */}
      <section id="features" style={{ background: 'rgba(234, 244, 255, 0.5)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--secondary)', letterSpacing: '1px', textTransform: 'uppercase' }}>Comprehensive Capability</span>
            <h2 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--primary)', marginTop: '8px' }}>Enterprise-Grade Protection Features</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            
            <div style={{ background: 'var(--card)', padding: '28px', borderRadius: '18px', border: '1px solid var(--border)' }}>
              <i className="fa-solid fa-bolt" style={{ fontSize: '24px', color: '#F59E0B', marginBottom: '16px', display: 'block' }} />
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px' }}>Real-Time Wattage & Time Telemetry</h3>
              <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-muted)' }}>
                Track power draw (W), maximum daily hours, and total monthly energy consumption (kWh) with sub-second accuracy.
              </p>
            </div>

            <div style={{ background: 'var(--card)', padding: '28px', borderRadius: '18px', border: '1px solid var(--border)' }}>
              <i className="fa-solid fa-power-off" style={{ fontSize: '24px', color: 'var(--danger)', marginBottom: '16px', display: 'block' }} />
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px' }}>Automated Emergency Shutdown</h3>
              <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-muted)' }}>
                Instant auto-shutdown triggers when operating hours or energy limits are exceeded, preventing electrical overheating.
              </p>
            </div>

            <div style={{ background: 'var(--card)', padding: '28px', borderRadius: '18px', border: '1px solid var(--border)' }}>
              <i className="fa-solid fa-brain" style={{ fontSize: '24px', color: '#8B5CF6', marginBottom: '16px', display: 'block' }} />
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px' }}>AI Predictive Analytics</h3>
              <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-muted)' }}>
                Intelligent algorithms forecast monthly utility bills and highlight anomalous device power surges before failures happen.
              </p>
            </div>

            <div style={{ background: 'var(--card)', padding: '28px', borderRadius: '18px', border: '1px solid var(--border)' }}>
              <i className="fa-solid fa-lock" style={{ fontSize: '24px', color: 'var(--primary)', marginBottom: '16px', display: 'block' }} />
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px' }}>Passcode & Admin Authorization</h3>
              <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-muted)' }}>
                Secure device registration with passcode protection. Incorrect attempts generate admin authorization access requests.
              </p>
            </div>

            <div style={{ background: 'var(--card)', padding: '28px', borderRadius: '18px', border: '1px solid var(--border)' }}>
              <i className="fa-solid fa-bell" style={{ fontSize: '24px', color: '#06B6D4', marginBottom: '16px', display: 'block' }} />
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px' }}>Instant Alerts & Notifications</h3>
              <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-muted)' }}>
                Receive real-time push notifications and warning banners whenever a device requires attention or exceeds limits.
              </p>
            </div>

            <div style={{ background: 'var(--card)', padding: '28px', borderRadius: '18px', border: '1px solid var(--border)' }}>
              <i className="fa-solid fa-file-invoice" style={{ fontSize: '24px', color: '#10B981', marginBottom: '16px', display: 'block' }} />
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px' }}>Support & Complaint Management</h3>
              <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-muted)' }}>
                Integrated support portal with live chat and ticket resolution for seamlessly communicating with administrators.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SMART ANALYSIS & RISK SCORE
      ───────────────────────────────────────────────────────────── */}
      <section id="analysis" style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px', alignItems: 'center' }}>
          
          <div>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--secondary)', letterSpacing: '1px', textTransform: 'uppercase' }}>AI Risk Assessment</span>
            <h2 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--primary)', marginTop: '8px', marginBottom: '16px' }}>
              Real-Time Electrical Hazard Risk Scoring
            </h2>
            <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--text-muted)', marginBottom: '24px' }}>
              Our neural analysis engine evaluates appliance age, current draw spikes, ambient target temperatures, and duty cycles to calculate a dynamic Risk Score for your home.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <i className="fa-solid fa-circle-check" style={{ color: '#10B981', fontSize: '18px' }} />
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)' }}>Prevent Overheating & Wire Degradation</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <i className="fa-solid fa-circle-check" style={{ color: '#10B981', fontSize: '18px' }} />
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)' }}>Identify High-Consumption Energy Drainers</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <i className="fa-solid fa-circle-check" style={{ color: '#10B981', fontSize: '18px' }} />
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)' }}>Automated Recommendations for Utility Optimization</span>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--card)', borderRadius: '24px', padding: '32px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--primary)' }}>Overall Home Risk Index</span>
              <span style={{ padding: '4px 12px', borderRadius: '99px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontWeight: 800, fontSize: '12px' }}>
                LOW RISK (12 / 100)
              </span>
            </div>

            <div style={{ background: 'rgba(234, 244, 255, 0.6)', borderRadius: '16px', padding: '20px', marginBottom: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', fontWeight: 900, color: '#10B981' }}>98.8%</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Electrical Safety Index</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Circuit Overload Risk</span>
                <span style={{ fontWeight: 700, color: '#10B981' }}>Minimal (2%)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Peak Load Spike Warning</span>
                <span style={{ fontWeight: 700, color: '#F59E0B' }}>Moderate (24%)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Thermal Threshold Compliance</span>
                <span style={{ fontWeight: 700, color: '#10B981' }}>Optimal (100%)</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SAFETY & PROTECTION
      ───────────────────────────────────────────────────────────── */}
      <section id="safety" style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)', color: '#FFFFFF', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#60A5FA', letterSpacing: '1px', textTransform: 'uppercase' }}>Safety First Engineering</span>
          <h2 style={{ fontSize: '32px', fontWeight: 900, marginTop: '8px', marginBottom: '16px' }}>
            Built to Prevent Electrical Disasters Before They Occur
          </h2>
          <p style={{ fontSize: '16px', color: '#94A3B8', maxWidth: '640px', marginInLine: 'auto', marginBottom: '48px' }}>
            Smart circuit monitoring, thermal threshold alarms, and automated cut-offs work in tandem to eliminate hazards.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', textAlign: 'left' }}>
            
            <div style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', padding: '24px', borderRadius: '16px' }}>
              <i className="fa-solid fa-shield-virus" style={{ fontSize: '24px', color: '#60A5FA', marginBottom: '12px', display: 'block' }} />
              <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '6px' }}>Short-Circuit Shield</h4>
              <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: 1.5 }}>
                Monitors rapid power fluctuations and isolates compromised lines in milliseconds.
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', padding: '24px', borderRadius: '16px' }}>
              <i className="fa-solid fa-temperature-arrow-up" style={{ fontSize: '24px', color: '#F87171', marginBottom: '12px', display: 'block' }} />
              <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '6px' }}>Thermal Safeguards</h4>
              <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: 1.5 }}>
                Enforces temperature limits (°C) on heating & cooling devices to prevent overheating.
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', padding: '24px', borderRadius: '16px' }}>
              <i className="fa-solid fa-user-lock" style={{ fontSize: '24px', color: '#FBBF24', marginBottom: '12px', display: 'block' }} />
              <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '6px' }}>Role-Based Access</h4>
              <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: 1.5 }}>
                Restricts appliance registration to authorized administrators via secure passcodes.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          ABOUT & CTA
      ───────────────────────────────────────────────────────────── */}
      <section id="about" style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
          borderRadius: '28px',
          padding: '56px 32px',
          border: '1px solid var(--border)'
        }}>
          <h2 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--primary)', marginBottom: '16px' }}>
            Ready to Take Control of Your Home Energy?
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--text-muted)', maxWidth: '560px', marginInLine: 'auto', marginBottom: '32px' }}>
            Join thousands of smart homeowners protecting their family and cutting power costs with Safe Power Home AI.
          </p>

          <div style={{ display: 'flex', justifyCenter: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {isLoggedIn ? (
              <Link href="/dashboard" style={{
                padding: '16px 36px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #C92A2A 0%, #A61E1E 100%)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '16px',
                textDecoration: 'none',
                boxShadow: '0 8px 24px rgba(201, 42, 42, 0.3)'
              }}>
                Open My Dashboard
              </Link>
            ) : (
              <>
                <Link href="/signup" style={{
                  padding: '16px 36px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #C92A2A 0%, #A61E1E 100%)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '16px',
                  textDecoration: 'none',
                  boxShadow: '0 8px 24px rgba(201, 42, 42, 0.3)'
                }}>
                  Create Free Account
                </Link>
                <Link href="/login" style={{
                  padding: '16px 32px',
                  borderRadius: '14px',
                  background: 'var(--card)',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  fontSize: '16px',
                  textDecoration: 'none',
                  border: '1px solid var(--border)'
                }}>
                  Account Login
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          FOOTER
      ───────────────────────────────────────────────────────────── */}
      <footer style={{ background: 'var(--card)', borderTop: '1px solid var(--border)', padding: '48px 24px 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '36px', marginBottom: '40px' }}>
            
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--primary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fa-solid fa-shield-halved" style={{ fontSize: '14px' }} />
                </div>
                <span style={{ fontWeight: 900, fontSize: '16px', color: 'var(--primary)' }}>Safe Power Home</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                AI-driven home energy optimization, real-time telemetry tracking, and automated electrical hazard protection.
              </p>
            </div>

            <div>
              <h4 style={{ fontWeight: 800, fontSize: '14px', color: 'var(--primary)', marginBottom: '16px' }}>Navigation</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <button onClick={() => handleNavClick('hero')} style={{ textAlign: 'left', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>Home</button>
                <button onClick={() => handleNavClick('how-it-works')} style={{ textAlign: 'left', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>How It Works</button>
                <button onClick={() => handleNavClick('features')} style={{ textAlign: 'left', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>Features</button>
                <button onClick={() => handleNavClick('analysis')} style={{ textAlign: 'left', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>Smart Analysis</button>
              </div>
            </div>

            <div>
              <h4 style={{ fontWeight: 800, fontSize: '14px', color: 'var(--primary)', marginBottom: '16px' }}>Authentication</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <Link href="/login" style={{ color: 'inherit', textDecoration: 'none' }}>User Login</Link>
                <Link href="/signup" style={{ color: 'inherit', textDecoration: 'none' }}>Register New Account</Link>
                <Link href="/dashboard" style={{ color: 'inherit', textDecoration: 'none' }}>Dashboard Console</Link>
                <Link href="/support" style={{ color: 'inherit', textDecoration: 'none' }}>Support Portal</Link>
              </div>
            </div>

            <div>
              <h4 style={{ fontWeight: 800, fontSize: '14px', color: 'var(--primary)', marginBottom: '16px' }}>Security & Trust</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '12px' }}>
                Protected by 256-bit encryption and Zero-Trust device authentication protocols.
              </p>
              <div style={{ display: 'flex', gap: '12px', color: 'var(--secondary)', fontSize: '18px' }}>
                <i className="fa-brands fa-github" />
                <i className="fa-solid fa-lock" />
                <i className="fa-solid fa-shield" />
              </div>
            </div>

          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <div>&copy; {new Date().getFullYear()} Safe Power Home AI. All rights reserved.</div>
            <div style={{ display: 'flex', gap: '20px' }}>
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Security Statement</span>
            </div>
          </div>

        </div>
      </footer>

      {/* Global CSS Responsive Fixes */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .desktop-nav-links, .desktop-nav-auth {
            display: none !important;
          }
          .mobile-hamburger-btn {
            display: block !important;
          }
        }
      `}</style>

    </div>
  );
}
