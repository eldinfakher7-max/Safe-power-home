'use client';
import { useState, useEffect } from 'react';
import LayoutWrapper from '@/components/LayoutWrapper';

export default function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('sph_token') : '';

  useEffect(() => {
    fetch('/api/settings', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setSettings(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(settings)
    });
    setSaving(false);
    setMsg({ type: res.ok ? 'success' : 'danger', text: res.ok ? 'Settings saved successfully!' : 'Failed to save settings.' });
    setTimeout(() => setMsg(null), 3000);
  }

  if (loading) return <LayoutWrapper pageTitle="Settings"><div style={{ textAlign: 'center', padding: 80 }}><div className="spinner" style={{ margin: '0 auto 16px' }} />Loading settings...</div></LayoutWrapper>;

  const fieldGroups = [
    {
      title: '⚡ Electrical Safety Thresholds',
      icon: 'fa-bolt',
      color: '#F59E0B',
      fields: [
        { key: 'voltage_min', label: 'Minimum Safe Voltage (V)', type: 'number', desc: 'Alert if voltage drops below this value' },
        { key: 'voltage_max', label: 'Maximum Safe Voltage (V)', type: 'number', desc: 'Alert if voltage exceeds this value' },
        { key: 'current_limit', label: 'Maximum Current Limit (A)', type: 'number', desc: 'Alert if current draw exceeds this threshold' },
        { key: 'temp_limit', label: 'Panel Temperature Limit (°C)', type: 'number', desc: 'Alert if panel temperature exceeds this value' },
      ]
    },
    {
      title: '🤖 AI & Monitoring',
      icon: 'fa-brain',
      color: '#8B5CF6',
      fields: [
        { key: 'ai_enabled', label: 'AI Safety Engine', type: 'toggle', desc: 'Enable real-time AI-powered risk analysis' },
        { key: 'firebase_notifications', label: 'Mobile Push Notifications (FCM)', type: 'toggle', desc: 'Send push notifications to mobile devices via Firebase' },
      ]
    },
    {
      title: '📡 System Integration',
      icon: 'fa-network-wired',
      color: '#06B6D4',
      fields: [
        { key: 'mqtt_broker', label: 'MQTT Broker URL', type: 'text', desc: 'MQTT server for IoT device integration (e.g. broker.hivemq.com)' },
      ]
    }
  ];

  return (
    <LayoutWrapper pageTitle="System Settings">
      <div style={{ maxWidth: 740, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontWeight: 800, fontSize: 22, color: 'var(--primary)' }}>System Configuration</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Configure safety thresholds, AI settings, and system integrations.</p>
        </div>

        {msg && (
          <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13, fontWeight: 600, display: 'flex', gap: 8, background: msg.type === 'success' ? '#DCFCE7' : '#FEE2E2', color: msg.type === 'success' ? '#15803D' : '#DC2626', border: `1px solid ${msg.type === 'success' ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.3)'}` }}>
            <i className={`fa-solid ${msg.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`} />
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {fieldGroups.map(group => (
            <div key={group.title} className="chart-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: group.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`fa-solid ${group.icon}`} style={{ color: group.color, fontSize: 16 }} />
                </div>
                <h3 style={{ fontWeight: 800, fontSize: 15, color: 'var(--primary)' }}>{group.title}</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {group.fields.map(field => (
                  <div key={field.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: 3 }}>{field.label}</label>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{field.desc}</div>
                    </div>
                    {field.type === 'toggle' ? (
                      <label className="toggle-switch" style={{ flexShrink: 0 }}>
                        <input
                          type="checkbox"
                          checked={settings[field.key] === 'true'}
                          onChange={e => setSettings(p => ({ ...p, [field.key]: e.target.checked ? 'true' : 'false' }))}
                        />
                        <span className="toggle-slider" />
                      </label>
                    ) : (
                      <input
                        className="form-input"
                        type={field.type}
                        value={settings[field.key] || ''}
                        onChange={e => setSettings(p => ({ ...p, [field.key]: e.target.value }))}
                        style={{ width: 200, flexShrink: 0 }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: '12px 28px' }}>
              {saving ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Saving...</> : <><i className="fa-solid fa-floppy-disk" /> Save Settings</>}
            </button>
          </div>
        </form>
      </div>
    </LayoutWrapper>
  );
}
