'use client';
import { useState, useEffect } from 'react';
import LayoutWrapper from '@/components/LayoutWrapper';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Tooltip, Legend, Filler } from 'chart.js';
import io from 'socket.io-client';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Tooltip, Legend, Filler);

let socket;

export default function LivePage() {
  const [t, setT] = useState({ voltage: 220, current: 0, power: 0, panelTemp: 35, riskScore: 0, status: 'SAFE' });
  const [history, setHistory] = useState({ voltage: Array(30).fill(220), current: Array(30).fill(0), power: Array(30).fill(0), temp: Array(30).fill(35) });
  const [devices, setDevices] = useState([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('sph_token') : '';

  useEffect(() => {
    fetch('/api/devices', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setDevices);

    socket = io();
    socket.on('live_telemetry', (data) => {
      setT(data);
      setHistory(h => ({
        voltage: [...h.voltage.slice(1), data.voltage],
        current: [...h.current.slice(1), data.current],
        power: [...h.power.slice(1), data.power],
        temp: [...h.temp.slice(1), data.panelTemp],
      }));
    });
    socket.on('device_metrics_updated', () => {
      fetch('/api/devices', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setDevices);
    });

    return () => socket?.disconnect();
  }, []);

  const labels = Array(30).fill('').map((_, i) => i % 5 === 0 ? `-${29-i}s` : '');

  function makeDataset(data, label, color) {
    return {
      labels,
      datasets: [{ label, data, borderColor: color, backgroundColor: color + '18', fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2.5 }]
    };
  }

  const chartOpts = { responsive: true, maintainAspectRatio: false, animation: { duration: 0 }, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { font: { size: 10 } } }, y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 10 } } } } };

  const riskColor = t.status === 'DANGER' ? '#EF4444' : t.status === 'WARNING' ? '#F59E0B' : '#10B981';

  const readings = [
    { label: 'Voltage', value: t.voltage?.toFixed(1), unit: 'V', icon: 'fa-plug', color: '#4DA3FF', normal: t.voltage >= 210 && t.voltage <= 245 },
    { label: 'Current', value: t.current?.toFixed(2), unit: 'A', icon: 'fa-arrow-trend-up', color: '#8B5CF6', normal: t.current < 13 },
    { label: 'Power Draw', value: t.power?.toFixed(0), unit: 'W', icon: 'fa-lightbulb', color: '#F59E0B', normal: t.power < 3000 },
    { label: 'Panel Temp', value: t.panelTemp?.toFixed(1), unit: '°C', icon: 'fa-temperature-half', color: t.panelTemp > 55 ? '#EF4444' : '#10B981', normal: t.panelTemp <= 55 },
  ];

  return (
    <LayoutWrapper pageTitle="Live Monitor">
      {/* Live indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 0 3px rgba(16,185,129,0.25)', animation: 'pulse-border 1.5s infinite' }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)' }}>LIVE — Streaming real-time grid telemetry</span>
      </div>

      {/* Reading cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {readings.map(r => (
          <div key={r.label} className="stat-card" style={{ borderTop: `3px solid ${r.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{r.label}</span>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: r.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={`fa-solid ${r.icon}`} style={{ color: r.color, fontSize: 14 }} />
              </div>
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: 'var(--primary)' }}>
              {r.value} <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>{r.unit}</span>
            </div>
            <div style={{ marginTop: 6 }}>
              <span className={`pill ${r.normal ? 'pill-active' : 'pill-offline'}`}>
                {r.normal ? '✓ Normal' : '⚠ Anomaly'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts 2x2 */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="chart-card">
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)', marginBottom: 12 }}>⚡ Voltage Trend (V)</div>
          <div style={{ height: 180 }}><Line data={makeDataset(history.voltage, 'Voltage', '#4DA3FF')} options={chartOpts} /></div>
        </div>
        <div className="chart-card">
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)', marginBottom: 12 }}>🔄 Current Draw (A)</div>
          <div style={{ height: 180 }}><Line data={makeDataset(history.current, 'Current', '#8B5CF6')} options={chartOpts} /></div>
        </div>
        <div className="chart-card">
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)', marginBottom: 12 }}>💡 Power Consumption (W)</div>
          <div style={{ height: 180 }}><Line data={makeDataset(history.power, 'Power', '#F59E0B')} options={chartOpts} /></div>
        </div>
        <div className="chart-card">
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)', marginBottom: 12 }}>🌡️ Panel Temperature (°C)</div>
          <div style={{ height: 180 }}><Line data={makeDataset(history.temp, 'Temperature', '#EF4444')} options={chartOpts} /></div>
        </div>
      </div>

      {/* Risk Score + Device Status */}
      <div className="grid-2">
        <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)', marginBottom: 16 }}>🛡️ Real-Time Safety Risk Score</div>
          <svg width="200" height="120" viewBox="0 0 100 60">
            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#E2E8F0" strokeWidth="8" strokeLinecap="round" />
            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={riskColor} strokeWidth="8" strokeLinecap="round"
              strokeDasharray="125" strokeDashoffset={125 - (t.riskScore / 100) * 125}
              style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.5s' }} />
            <text x="50" y="45" textAnchor="middle" fontSize="13" fontWeight="900" fill={riskColor}>{t.riskScore}%</text>
          </svg>
          <div style={{ fontWeight: 900, fontSize: 20, color: riskColor, marginTop: 4 }}>{t.status}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, maxWidth: 200 }}>
            {t.status === 'SAFE' ? 'All electrical parameters within normal operating limits.' : t.status === 'WARNING' ? 'System load is elevated. Consider turning off non-essential devices.' : 'CRITICAL: Electrical safety thresholds exceeded! Immediate action required.'}
          </div>
        </div>

        <div className="chart-card">
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)', marginBottom: 16 }}>⚡ Device Channel Status</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto' }}>
            {devices.map(d => {
              const pct = Math.min((d.currentConsumption / d.maxEnergyConsumption) * 100, 100);
              return (
                <div key={d._id || d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <i className={`fa-solid ${d.imageIcon || 'fa-plug'}`} style={{ color: d.state === 1 ? 'var(--success)' : 'var(--text-muted)', fontSize: 16, width: 18 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{d.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.currentConsumption.toFixed(2)} kWh</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 100 ? 'var(--danger)' : pct > 80 ? 'var(--warning)' : 'var(--secondary)' }} />
                    </div>
                  </div>
                  <span className={`pill ${d.state === 1 ? 'pill-active' : 'pill-offline'}`} style={{ fontSize: 10 }}>{d.state === 1 ? 'ON' : 'OFF'}</span>
                </div>
              );
            })}
            {devices.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0', fontSize: 13 }}>No devices registered yet.</div>}
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
