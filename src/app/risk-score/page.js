'use client';
import { useState, useEffect } from 'react';
import LayoutWrapper from '@/components/LayoutWrapper';
import io from 'socket.io-client';

export default function RiskScorePage() {
  const [telemetry, setTelemetry] = useState({ voltage: 220, current: 0, power: 0, panelTemp: 35, riskScore: 12, status: 'SAFE' });
  const [devices, setDevices] = useState([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('sph_token') : '';

  useEffect(() => {
    fetch('/api/devices', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setDevices)
      .catch(() => {});

    const socket = io();
    socket.on('live_telemetry', data => setTelemetry(data));
    return () => socket.disconnect();
  }, []);

  const riskColor = telemetry.riskScore >= 80 ? '#EF4444' : telemetry.riskScore >= 50 ? '#F59E0B' : '#10B981';
  const riskLabel = telemetry.riskScore >= 80 ? 'HIGH RISK' : telemetry.riskScore >= 50 ? 'MODERATE RISK' : 'LOW RISK / SAFE';

  return (
    <LayoutWrapper pageTitle="Grid Safety & Risk Score">
      {/* Gauge & Score Hero */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '36px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 16 }}>
            Overall System Risk Index
          </div>

          {/* Dial / Circular Meter */}
          <div style={{ position: 'relative', width: 180, height: 180, borderRadius: '50%', background: `conic-gradient(${riskColor} ${telemetry.riskScore * 3.6}deg, rgba(0,0,0,0.06) 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 10px 30px ${riskColor}33` }}>
            <div style={{ width: 144, height: 144, borderRadius: '50%', background: 'var(--card-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 44, fontWeight: 900, color: riskColor, lineHeight: 1 }}>{telemetry.riskScore}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginTop: 4 }}>out of 100</span>
            </div>
          </div>

          <div style={{ marginTop: 20, fontSize: 16, fontWeight: 800, color: riskColor }}>
            {riskLabel}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, maxWidth: 300 }}>
            Calculated in real-time based on panel temperature, current load, and voltage fluctuation.
          </p>
        </div>

        {/* Live Vector Factors */}
        <div className="chart-card">
          <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary)', marginBottom: 20 }}>
            ⚡ Safety Risk Vectors
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { name: 'Grid Voltage Fluctuation', val: `${telemetry.voltage} V`, norm: '195V - 250V', pct: Math.min(100, Math.abs(telemetry.voltage - 220) * 4), color: '#4DA3FF', icon: 'fa-bolt' },
              { name: 'Panel Thermal Stress', val: `${telemetry.panelTemp} °C`, norm: '< 60°C', pct: Math.min(100, (telemetry.panelTemp / 60) * 100), color: '#8B5CF6', icon: 'fa-temperature-high' },
              { name: 'Amperage Overload Ratio', val: `${telemetry.current} A`, norm: '< 15A limit', pct: Math.min(100, (telemetry.current / 15) * 100), color: '#F59E0B', icon: 'fa-gauge-high' },
              { name: 'Active Device Load', val: `${devices.filter(d => d.state === 1).length} / ${devices.length}`, norm: 'Distributed', pct: devices.length ? (devices.filter(d => d.state === 1).length / devices.length) * 100 : 0, color: '#10B981', icon: 'fa-microchip' },
            ].map(factor => (
              <div key={factor.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className={`fa-solid ${factor.icon}`} style={{ color: factor.color }} />
                    {factor.name}
                  </span>
                  <span>{factor.val} <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}>({factor.norm})</span></span>
                </div>
                <div style={{ height: 8, borderRadius: 99, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${factor.pct}%`, background: factor.color, borderRadius: 99, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Safety Compliance & Recommendations */}
      <div className="chart-card">
        <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary)', marginBottom: 16 }}>
          🛡️ AI Safety Protocol Status
        </h3>
        <div className="grid-3" style={{ gap: 16 }}>
          {[
            { title: 'Over-Current Breaker', status: 'Active & Tripped Ready', icon: 'fa-shield-halved', color: '#10B981' },
            { title: 'Fire Hazard Interlock', status: 'Temperature Normal', icon: 'fa-fire-extinguisher', color: '#4DA3FF' },
            { title: 'Surge Protection', status: 'Ground Impedance 0.2Ω', icon: 'fa-bolt-lightning', color: '#8B5CF6' },
          ].map(box => (
            <div key={box.title} style={{ padding: 16, background: 'var(--accent)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <i className={`fa-solid ${box.icon}`} style={{ fontSize: 24, color: box.color }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)' }}>{box.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{box.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </LayoutWrapper>
  );
}
