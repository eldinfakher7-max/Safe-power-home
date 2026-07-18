'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function Header({ onMenuClick, pageTitle }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [notifs, setNotifs] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const u = localStorage.getItem('sph_user');
    if (u) setUser(JSON.parse(u));
    fetchNotifs();

    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchNotifs() {
    const token = localStorage.getItem('sph_token');
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setNotifs(data.slice(0, 10));
      }
    } catch (e) {}
  }

  async function markAllRead() {
    const token = localStorage.getItem('sph_token');
    await fetch('/api/notifications/read-all', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    fetchNotifs();
  }

  function toggleDark() {
    setIsDark(p => !p);
    document.documentElement.classList.toggle('dark');
  }

  const unread = notifs.filter(n => n.status === 'Unread').length;

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={onMenuClick}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: 'var(--text-muted)' }}
        >
          <i className="fa-solid fa-bars" style={{ fontSize: 18 }} />
        </button>

        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--primary)' }}>{pageTitle || 'Dashboard'}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
            {pathname.split('/').filter(Boolean).map((b, i, arr) => (
              <span key={i}>
                {i > 0 && <span style={{ margin: '0 4px', opacity: 0.5 }}>/</span>}
                <span style={{ textTransform: 'capitalize' }}>{b.replace(/-/g, ' ')}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDark}
          style={{ background: 'var(--accent)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 11px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 15, transition: 'var(--transition)' }}
        >
          <i className={`fa-solid ${isDark ? 'fa-sun' : 'fa-moon'}`} />
        </button>

        {/* Notifications Bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifs(p => !p)}
            style={{ background: 'var(--accent)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 11px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 15, position: 'relative', transition: 'var(--transition)' }}
          >
            <i className="fa-solid fa-bell" />
            {unread > 0 && (
              <span style={{ position: 'absolute', top: 3, right: 3, background: 'var(--danger)', color: 'white', fontSize: 9, fontWeight: 800, minWidth: 16, height: 16, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--card)' }}>
                {unread}
              </span>
            )}
          </button>

          {showNotifs && (
            <div style={{ position: 'absolute', right: 0, top: '110%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)', width: 320, zIndex: 99, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>
                  Notifications {unread > 0 && <span style={{ background: 'var(--danger)', color: 'white', borderRadius: 99, fontSize: 10, padding: '1px 6px', marginLeft: 6 }}>{unread}</span>}
                </span>
                <button onClick={markAllRead} style={{ fontSize: 11, color: 'var(--secondary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Mark all read</button>
              </div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {notifs.length === 0 && (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    <i className="fa-solid fa-bell-slash" style={{ fontSize: 24, marginBottom: 8, display: 'block' }} />
                    No notifications
                  </div>
                )}
                {notifs.map((n, i) => (
                  <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.04)', background: n.status === 'Unread' ? 'rgba(77,163,255,0.05)' : 'transparent', transition: 'var(--transition)' }}>
                    {n.status === 'Unread' && <div style={{ width: 6, height: 6, background: 'var(--secondary)', borderRadius: '50%', marginBottom: 4 }} />}
                    <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>{n.message}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{new Date(n.timestamp).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        {user && (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--accent)', transition: 'var(--transition)' }}
            onClick={() => router.push('/profile')}
          >
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{user.name?.split(' ')[0]}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{user.userType}</div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
