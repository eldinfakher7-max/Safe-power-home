'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const userNavLinks = [
  { href: '/dashboard', icon: 'fa-gauge', label: 'Dashboard' },
  { href: '/devices', icon: 'fa-microchip', label: 'My Devices' },
  { href: '/live', icon: 'fa-chart-line', label: 'Live Monitor' },
  { href: '/energy', icon: 'fa-bolt', label: 'Energy Analytics' },
  { href: '/alerts', icon: 'fa-triangle-exclamation', label: 'Alerts' },
  { href: '/reports', icon: 'fa-file-lines', label: 'Reports' },
  { href: '/support', icon: 'fa-headset', label: 'Support' },
  { href: '/complaints', icon: 'fa-comments', label: 'My Tickets' },
  { href: '/profile', icon: 'fa-circle-user', label: 'My Profile' },
];

const adminNavLinks = [
  { href: '/dashboard', icon: 'fa-gauge', label: 'Dashboard' },
  { href: '/admin/users', icon: 'fa-users', label: 'Manage Users' },
  { href: '/admin/devices', icon: 'fa-microchip', label: 'All Devices' },
  { href: '/admin/requests', icon: 'fa-user-lock', label: 'Device Requests' },
  { href: '/live', icon: 'fa-chart-line', label: 'Live Monitor' },
  { href: '/energy', icon: 'fa-bolt', label: 'Energy Analytics' },
  { href: '/alerts', icon: 'fa-triangle-exclamation', label: 'Alerts' },
  { href: '/investigation', icon: 'fa-magnifying-glass-chart', label: 'Investigation' },
  { href: '/risk-score', icon: 'fa-shield-halved', label: 'Risk Score' },
  { href: '/ai-prediction', icon: 'fa-brain', label: 'AI Prediction' },
  { href: '/reports', icon: 'fa-file-lines', label: 'Reports' },
  { href: '/complaint-mgmt', icon: 'fa-inbox', label: 'Complaint Desk' },
  { href: '/settings', icon: 'fa-sliders', label: 'System Settings' },
  { href: '/history', icon: 'fa-clock-rotate-left', label: 'Audit Logs' },
  { href: '/profile', icon: 'fa-circle-user', label: 'My Profile' },
];

export default function Sidebar({ open, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = localStorage.getItem('sph_user');
    if (u) setUser(JSON.parse(u));
  }, []);

  const links = user?.userType === 'Admin' ? adminNavLinks : userNavLinks;

  function logout() {
    localStorage.removeItem('sph_token');
    localStorage.removeItem('sph_user');
    router.push('/login');
  }

  return (
    <>
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 30 }}
          onClick={onClose}
        />
      )}

      <aside style={{
        width: 260,
        minHeight: '100vh',
        height: '100vh',
        background: 'var(--card)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        overflowY: 'auto',
        zIndex: 40,
        flexShrink: 0,
        boxShadow: '2px 0 20px rgba(30,58,138,0.06)',
        transition: 'var(--transition)',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #1E3A8A, #4DA3FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(30,58,138,0.3)' }}>
              <i className="fa-solid fa-bolt" style={{ color: 'white', fontSize: 18 }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--primary)', lineHeight: 1.2 }}>Smart Power</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: 0.5 }}>HOME AI</div>
            </div>
          </div>
        </div>

        {/* User chip */}
        {user && (
          <div style={{ padding: '12px', margin: '12px', borderRadius: 10, background: 'var(--accent)', border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
              <span style={{
                background: user.userType === 'Admin' ? 'rgba(30,58,138,0.12)' : 'rgba(77,163,255,0.12)',
                color: user.userType === 'Admin' ? 'var(--primary)' : 'var(--secondary)',
                padding: '1px 8px', borderRadius: 99, fontWeight: 700, fontSize: 10
              }}>{user.userType}</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '4px 12px', overflowY: 'auto' }}>
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${pathname === link.href ? 'active' : ''}`}
              onClick={() => onClose && onClose()}
              style={{ marginBottom: 2, display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <i className={`fa-solid ${link.icon}`} style={{ width: 18, textAlign: 'center', fontSize: 14 }} />
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px 12px 20px' }}>
          <button
            onClick={logout}
            className="nav-link"
            style={{ width: '100%', color: 'var(--danger)', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', cursor: 'pointer' }}
          >
            <i className="fa-solid fa-arrow-right-from-bracket" style={{ width: 18, textAlign: 'center', fontSize: 14 }} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
