'use client';
import { useState, useEffect } from 'react';
import LayoutWrapper from '@/components/LayoutWrapper';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('All');
  const token = typeof window !== 'undefined' ? localStorage.getItem('sph_token') : '';

  useEffect(() => { loadAlerts(); }, []);

  async function loadAlerts() {
    const res = await fetch('/api/alerts', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setAlerts(await res.json());
  }

  async function resolveAlert(id) {
    await fetch(`/api/alerts/${id}/resolve`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
    loadAlerts();
  }

  const filtered = filter === 'All' ? alerts : alerts.filter(a => a.status === filter || a.severity === filter);

  const sevColor = { Info: 'var(--info)', Warning: 'var(--warning)', Danger: 'var(--danger)' };
  const sevIcon = { Info: 'fa-circle-info', Warning: 'fa-triangle-exclamation', Danger: 'fa-circle-xmark' };

  return (
    <LayoutWrapper pageTitle="Safety Alerts">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 20 }}>System Alerts</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{alerts.filter(a => a.status === 'Active').length} active · {alerts.length} total</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['All', 'Active', 'Resolved', 'Warning', 'Danger'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>

      <div className="chart-card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <i className="fa-solid fa-shield-check" style={{ fontSize: 48, marginBottom: 16, color: 'var(--success)', opacity: 0.6 }} />
              <div style={{ fontWeight: 700, fontSize: 16 }}>All Clear!</div>
              <p style={{ fontSize: 13, marginTop: 4 }}>No alerts match the current filter.</p>
            </div>
          ) : filtered.map((a, i) => (
            <div key={a._id || i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '16px', background: 'rgba(0,0,0,0.02)', borderRadius: 12, border: `1px solid ${sevColor[a.severity]}30`, borderLeft: `4px solid ${sevColor[a.severity]}` }}>
              <i className={`fa-solid ${sevIcon[a.severity]}`} style={{ color: sevColor[a.severity], fontSize: 20, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)', marginBottom: 4 }}>{a.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{a.message}</div>
                    {a.deviceName && <div style={{ fontSize: 11, color: 'var(--secondary)', marginTop: 4, fontWeight: 600 }}>Device: {a.deviceName}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, marginLeft: 12 }}>
                    <span className={`pill ${a.status === 'Active' ? 'pill-warning' : 'pill-resolved'}`}>{a.status}</span>
                    <span className="pill" style={{ background: sevColor[a.severity] + '18', color: sevColor[a.severity] }}>{a.severity}</span>
                    {a.status === 'Active' && (
                      <button className="btn btn-success btn-sm" onClick={() => resolveAlert(a._id || a.id)}>
                        <i className="fa-solid fa-check" /> Resolve
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                  {a.timestamp ? new Date(a.timestamp).toLocaleString() : '—'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </LayoutWrapper>
  );
}
