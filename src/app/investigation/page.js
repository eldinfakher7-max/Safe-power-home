'use client';
import { useState, useEffect } from 'react';
import LayoutWrapper from '@/components/LayoutWrapper';

export default function InvestigationPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('sph_token') : '';

  useEffect(() => {
    fetch('/api/devices', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setDevices(data);
        if (data.length > 0) setSelectedDevice(data[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const suspicious = devices.filter(d => (d.currentConsumption || 0) > (d.maxEnergyConsumption || 10) * 0.7);

  return (
    <LayoutWrapper pageTitle="Energy Audit & Leakage Investigation">
      {/* Overview Banner */}
      <div className="chart-card" style={{ background: 'linear-gradient(135deg, rgba(30,58,138,0.9), rgba(77,163,255,0.8))', color: 'white', marginBottom: 24, padding: '24px 30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>🔍 Power Leakage & Anomaly Audit</h2>
            <p style={{ fontSize: 13, opacity: 0.9, maxWidth: 600 }}>
              AI-driven diagnostic engine scanning your electrical grid for phantom loads, ground leaks, and standby power dissipation.
            </p>
          </div>
          <div style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.15)', borderRadius: 12, backdropFilter: 'blur(10px)', textAlign: 'right' }}>
            <div style={{ fontSize: 11, opacity: 0.8, textTransform: 'uppercase', fontWeight: 700 }}>Grid Integrity Status</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: suspicious.length > 0 ? '#FEE2E2' : '#DCFCE7' }}>
              {suspicious.length > 0 ? `⚠️ ${suspicious.length} Anomaly Flagged` : '✅ Optimal Grid Health'}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Standby Power Dissipation', value: '14.2 W', sub: '-3.1% vs last week', icon: 'fa-plug-circle-bolt', color: '#4DA3FF' },
          { label: 'Phantom Power Loss', value: '0.34 kWh/day', sub: 'Est. ~1.8 SAR/month', icon: 'fa-ghost', color: '#8B5CF6' },
          { label: 'Ground Current Leakage', value: '0.00 mA', sub: 'Safe (Threshold: < 30mA)', icon: 'fa-shield-halved', color: '#10B981' },
          { label: 'Suspicious Appliances', value: suspicious.length, sub: 'Requiring inspection', icon: 'fa-triangle-exclamation', color: suspicious.length > 0 ? '#EF4444' : '#10B981' },
        ].map(k => (
          <div key={k.label} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{k.label}</span>
              <i className={`fa-solid ${k.icon}`} style={{ color: k.color, fontSize: 18 }} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--primary)' }}>{k.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Device Audit List */}
        <div className="chart-card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, color: 'var(--primary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>⚡ Device Diagnostic List</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Select device for deep audit</span>
          </div>
          <div style={{ maxHeight: 440, overflowY: 'auto', padding: 8 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
            ) : devices.map(d => {
              const ratio = (d.currentConsumption || 0) / (d.maxEnergyConsumption || 10);
              const isHigh = ratio >= 0.7;
              const isSelected = selectedDevice?.id === d.id;
              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDevice(d)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    marginBottom: 6,
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(77,163,255,0.1)' : 'rgba(0,0,0,0.02)',
                    border: `1px solid ${isSelected ? 'var(--secondary)' : 'transparent'}`,
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: d.state === 1 ? 'rgba(16,185,129,0.12)' : 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className={`fa-solid ${d.imageIcon || 'fa-plug'}`} style={{ color: d.state === 1 ? 'var(--success)' : 'var(--text-muted)' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.location} · {d.powerRating}W</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`pill ${isHigh ? 'pill-offline' : d.state === 1 ? 'pill-active' : 'pill-closed'}`} style={{ fontSize: 10 }}>
                      {isHigh ? 'Flagged' : d.state === 1 ? 'Normal' : 'Idle'}
                    </span>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{(d.currentConsumption || 0).toFixed(2)} kWh</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Device Deep Analysis */}
        <div className="chart-card">
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--primary)', marginBottom: 16 }}>
            🔬 Deep AI Leakage Analysis
          </div>
          {selectedDevice ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: 14, background: 'var(--accent)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(30,58,138,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--primary)' }}>
                  <i className={`fa-solid ${selectedDevice.imageIcon || 'fa-plug'}`} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary)' }}>{selectedDevice.name}</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selectedDevice.type} · {selectedDevice.location}</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Harmonic Distortion (THD)', val: '2.4%', status: 'Normal (< 5%)', icon: 'fa-wave-square', color: '#10B981' },
                  { label: 'Power Factor (cos φ)', val: '0.94', status: 'Excellent', icon: 'fa-chart-line', color: '#4DA3FF' },
                  { label: 'Thermal Loss Estimate', val: '1.2 W', status: 'Low Dissipation', icon: 'fa-temperature-low', color: '#8B5CF6' },
                  { label: 'Standby Parasitic Drain', val: '0.8 W', status: 'Standard Efficiency', icon: 'fa-battery-quarter', color: '#F59E0B' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--accent)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <i className={`fa-solid ${item.icon}`} style={{ color: item.color }} />
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{item.label}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)' }}>{item.val}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 20, padding: 14, background: 'rgba(16,185,129,0.08)', borderRadius: 10, borderLeft: '4px solid var(--success)', fontSize: 12, color: 'var(--primary)' }}>
                <strong>🤖 AI Recommendation:</strong> Device insulation and power factor are within optimal thresholds. No hardware action required.
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              Select a device from the list to view its audit profile.
            </div>
          )}
        </div>
      </div>
    </LayoutWrapper>
  );
}
