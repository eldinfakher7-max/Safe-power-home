'use client';
import { useState, useEffect } from 'react';
import LayoutWrapper from '@/components/LayoutWrapper';

export default function HistoryPage() {
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('sph_token') : '';

  useEffect(() => {
    fetch('/api/history/logs', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setLogs).catch(() => {});
    fetch('/api/alerts', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setAlerts).catch(() => {});
  }, []);

  return (
    <LayoutWrapper pageTitle="Audit Logs & History">
      <div className="grid-2">
        {/* Alert History */}
        <div className="chart-card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, color: 'var(--primary)', display: 'flex', justifyContent: 'space-between' }}>
            <span><i className="fa-solid fa-shield-halved" style={{ marginRight: 8, color: 'var(--danger)' }} />Alert History</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>{alerts.length} records</span>
          </div>
          <div style={{ maxHeight: 520, overflowY: 'auto' }}>
            {alerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: 13 }}>
                <i className="fa-solid fa-shield-check" style={{ fontSize: 32, marginBottom: 10, display: 'block', color: 'var(--success)', opacity: 0.6 }} />
                No alert history
              </div>
            ) : alerts.map((a, i) => (
              <div key={a._id || i} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.04)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <i className={`fa-solid ${a.severity === 'Danger' ? 'fa-circle-xmark' : a.severity === 'Warning' ? 'fa-triangle-exclamation' : 'fa-circle-info'}`}
                  style={{ color: a.severity === 'Danger' ? 'var(--danger)' : a.severity === 'Warning' ? 'var(--warning)' : 'var(--info)', fontSize: 16, marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{a.message}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 8 }}>
                    <span>{a.timestamp ? new Date(a.timestamp).toLocaleString() : '—'}</span>
                    <span className={`pill ${a.status === 'Active' ? 'pill-warning' : 'pill-resolved'}`} style={{ fontSize: 9 }}>{a.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Logs */}
        <div className="chart-card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, color: 'var(--primary)', display: 'flex', justifyContent: 'space-between' }}>
            <span><i className="fa-solid fa-clock-rotate-left" style={{ marginRight: 8, color: 'var(--secondary)' }} />Device Activity Log</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>{logs.length} records</span>
          </div>
          <div style={{ maxHeight: 520, overflowY: 'auto' }}>
            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: 13 }}>
                <i className="fa-solid fa-database" style={{ fontSize: 32, marginBottom: 10, display: 'block', opacity: 0.3 }} />
                Device activity logs will appear here as devices are controlled.
              </div>
            ) : logs.map((l, i) => (
              <div key={i} style={{ padding: '12px 20px', borderBottom: '1px solid rgba(0,0,0,0.04)', display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.action === 'ON' ? 'var(--success)' : 'var(--danger)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{l.deviceName} — <span style={{ color: l.action === 'ON' ? 'var(--success)' : 'var(--danger)' }}>{l.action}</span></div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.timestamp ? new Date(l.timestamp).toLocaleString() : '—'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
