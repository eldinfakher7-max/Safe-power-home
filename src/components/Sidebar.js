'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const userNavLinks = [
  { href: '/chat', icon: 'fa-robot', label: 'Safe Power AI Chat' },
  { href: '/dashboard', icon: 'fa-gauge', label: 'Dashboard' },
  { href: '/devices', icon: 'fa-microchip', label: 'My Devices' },
  { href: '/live', icon: 'fa-chart-line', label: 'Live Monitor' },
  { href: '/energy', icon: 'fa-bolt', label: 'Energy Analytics' },
  { href: '/alerts', icon: 'fa-triangle-exclamation', label: 'Alerts' },
  { href: '/investigation', icon: 'fa-magnifying-glass-chart', label: 'Investigation' },
  { href: '/risk-score', icon: 'fa-shield-halved', label: 'Risk Score' },
  { href: '/ai-prediction', icon: 'fa-brain', label: 'AI Prediction' },
  { href: '/reports', icon: 'fa-file-lines', label: 'Reports' },
  { href: '/support', icon: 'fa-headset', label: 'Support' },
  { href: '/complaints', icon: 'fa-comments', label: 'My Tickets' },
  { href: '/profile', icon: 'fa-circle-user', label: 'My Profile' },
];

const adminNavLinks = [
  { href: '/chat', icon: 'fa-robot', label: 'Safe Power AI Chat' },
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
          className="sidebar-backdrop"
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #C92A2A, #A61E1E)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(201,42,42,0.35)', flexShrink: 0 }}>
              <i className="fa-solid fa-bolt" style={{ color: 'white', fontSize: 18 }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--primary)', lineHeight: 1.2 }}>Smart Power</div>
              <div style={{ fontSize: 10, color: 'var(--brand-red)', fontWeight: 800, letterSpacing: 0.5 }}>HOME AI</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="sidebar-close-btn"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, padding: 4 }}
            aria-label="Close Sidebar"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* User chip */}
        {user && (
          <div style={{ padding: '12px', margin: '12px', borderRadius: 10, background: 'var(--accent)', border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
              <span style={{
                background: user.userType === 'Admin' ? 'rgba(201,42,42,0.12)' : 'rgba(122,75,42,0.12)',
                color: user.userType === 'Admin' ? 'var(--brand-red)' : 'var(--secondary)',
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
            style={{ width: '100%', color: 'var(--brand-red)', background: 'rgba(201,42,42,0.06)', border: '1px solid rgba(201,42,42,0.15)', cursor: 'pointer' }}
          >
            <i className="fa-solid fa-arrow-right-from-bracket" style={{ width: 18, textAlign: 'center', fontSize: 14 }} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
