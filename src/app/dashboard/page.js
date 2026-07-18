'use client';
import { useState, useEffect, useRef } from 'react';
import LayoutWrapper, { useToast } from '@/components/LayoutWrapper';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler
} from 'chart.js';
import io from 'socket.io-client';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

let socket;

function StatCard({ icon, label, value, trend, color, unit }) {
  return (
    <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className={`fa-solid ${icon}`} style={{ color, fontSize: 15 }} />
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>
        {value} <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>{unit}</span>
      </div>
      {trend && (
        <div style={{ fontSize: 12, color: trend.up ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <i className={`fa-solid ${trend.up ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`} />
          {trend.label}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [telemetry, setTelemetry] = useState({ voltage: 0, current: 0, power: 0, panelTemp: 0, riskScore: 0, status: 'SAFE' });
  const [devices, setDevices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [authRequests, setAuthRequests] = useState([]);
  const [user, setUser] = useState(null);
  const [powerHistory, setPowerHistory] = useState(Array(20).fill(0));
  const [warnings, setWarnings] = useState([]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('sph_token') : null;
  const userObj = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('sph_user') || '{}') : {};

  useEffect(() => {
    setUser(userObj);
    loadDevices();
    loadAlerts();
    if (userObj.userType === 'Admin') loadAuthRequests();

    // Socket.IO
    socket = io();
    socket.on('live_telemetry', (data) => {
      setTelemetry(data);
      setPowerHistory(p => {
        const next = [...p.slice(1), data.power];
        return next;
      });
    });

    socket.on('limit_warning_alert', (data) => {
      setWarnings(p => [...p, data]);
      // Auto-dismiss after 8s
      setTimeout(() => setWarnings(p => p.slice(1)), 8000);
    });

    socket.on('device_metrics_updated', () => loadDevices());
    socket.on('new_auth_request', () => { if (userObj.userType === 'Admin') loadAuthRequests(); });

    return () => { if (socket) socket.disconnect(); };
  }, []);

  async function loadDevices() {
    const res = await fetch('/api/devices', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setDevices(await res.json());
  }

  async function loadAlerts() {
    const res = await fetch('/api/alerts', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setAlerts(data.filter(a => a.status === 'Active').slice(0, 5));
    }
  }

  async function loadAuthRequests() {
    const res = await fetch('/api/admin/requests', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setAuthRequests(data.filter(r => r.status === 'Pending'));
    }
  }

  async function handleRequest(id, status) {
    await fetch(`/api/admin/requests/${id}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, admin_notes: `${status} by admin via dashboard.` })
    });
    loadAuthRequests();
  }

  async function toggleDevice(id, currentState) {
    await fetch(`/api/devices/${id}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ state: currentState === 1 ? 0 : 1 })
    });
    loadDevices();
  }

  const chartLabels = powerHistory.map((_, i) => (i === powerHistory.length - 1 ? 'Now' : `${powerHistory.length - 1 - i}s`));

  const lineChartData = {
    labels: chartLabels,
    datasets: [{
      label: 'Power (W)',
      data: powerHistory,
      borderColor: '#4DA3FF',
      backgroundColor: 'rgba(77,163,255,0.1)',
      borderWidth: 2.5,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
    }]
  };

  const deviceTypes = devices.reduce((acc, d) => {
    acc[d.type] = (acc[d.type] || 0) + 1;
    return acc;
  }, {});

  const doughnutData = {
    labels: Object.keys(deviceTypes),
    datasets: [{ data: Object.values(deviceTypes), backgroundColor: ['#4DA3FF', '#1E3A8A', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'], borderWidth: 0 }]
  };

  const activeDevices = devices.filter(d => d.state === 1).length;
  const totalConsumption = devices.reduce((s, d) => s + (d.currentConsumption || 0), 0);

  const riskColor = telemetry.status === 'DANGER' ? 'var(--danger)' : telemetry.status === 'WARNING' ? 'var(--warning)' : 'var(--success)';

  return (
    <LayoutWrapper pageTitle="Dashboard">
      {/* Warning banners */}
      {warnings.map((w, i) => (
        <div key={i} className="warning-banner" style={{ marginBottom: 8 }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--danger)', fontSize: 18 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--danger)' }}>{w.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{w.message}</div>
          </div>
        </div>
      ))}

      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon="fa-plug" label="Line Voltage" value={telemetry.voltage?.toFixed(1)} unit="V" color="#4DA3FF" trend={{ up: telemetry.voltage >= 210, label: telemetry.voltage >= 210 ? 'Optimal' : 'Low Voltage' }} />
        <StatCard icon="fa-arrow-trend-up" label="Current Load" value={telemetry.current?.toFixed(2)} unit="A" color="#8B5CF6" trend={{ up: telemetry.current < 12, label: telemetry.current < 12 ? 'Normal Range' : 'High Load' }} />
        <StatCard icon="fa-lightbulb" label="Power Draw" value={telemetry.power?.toFixed(0)} unit="W" color="#F59E0B" trend={{ up: telemetry.power < 2500, label: telemetry.power < 2500 ? 'Acceptable' : 'High Usage' }} />
        <StatCard icon="fa-temperature-half" label="Panel Temp" value={telemetry.panelTemp?.toFixed(1)} unit="°C" color={telemetry.panelTemp > 55 ? '#EF4444' : '#10B981'} trend={{ up: telemetry.panelTemp <= 55, label: telemetry.panelTemp <= 55 ? 'Safe' : 'Overheating' }} />
        <StatCard icon="fa-microchip" label="Active Devices" value={activeDevices} unit="" color="#10B981" trend={{ up: true, label: `${devices.length} total registered` }} />
        <StatCard icon="fa-bolt" label="Total Consumption" value={totalConsumption.toFixed(2)} unit="kWh" color="#06B6D4" trend={{ up: totalConsumption < 20, label: 'Today' }} />
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Live Power Chart */}
        <div className="chart-card">
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fa-solid fa-chart-line" style={{ color: 'var(--secondary)' }} />
            Live Power Usage Trend
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', animation: 'pulse-border 1.5s infinite' }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Live</span>
            </div>
          </div>
          <div style={{ height: 200 }}>
            <Line data={lineChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { font: { size: 10 } } }, y: { suggestedMin: 0, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 10 } } } }, animation: { duration: 0 } }} />
          </div>
        </div>

        {/* Risk Gauge + Device Types */}
        <div className="chart-card">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, height: '100%' }}>
            {/* Risk Gauge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)', marginBottom: 12 }}>🛡️ AI Risk Score</div>
              <svg width="150" height="90" viewBox="0 0 100 60">
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#E2E8F0" strokeWidth="8" strokeLinecap="round" />
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke={riskColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="125"
                  strokeDashoffset={125 - (telemetry.riskScore / 100) * 125}
                  style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.5s' }}
                />
                <text x="50" y="46" textAnchor="middle" fontSize="14" fontWeight="900" fill={riskColor}>{telemetry.riskScore}%</text>
              </svg>
              <div style={{ fontWeight: 800, fontSize: 14, color: riskColor }}>{telemetry.status}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
                {telemetry.status === 'SAFE' ? 'All parameters normal' : telemetry.status === 'WARNING' ? 'Load approaching limit' : 'CRITICAL: Action required'}
              </div>
            </div>

            {/* Device types doughnut */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)', marginBottom: 8 }}>⚡ Device Types</div>
              <div style={{ height: 120 }}>
                {devices.length > 0 ? (
                  <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { font: { size: 10 }, boxWidth: 10 } } }, cutout: '65%' }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 12 }}>No devices</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Requests + Alerts Row */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Active Alerts */}
        <div className="chart-card">
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)', marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <span><i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--warning)', marginRight: 8 }} />Active Alerts</span>
            <a href="/alerts" style={{ fontSize: 12, color: 'var(--secondary)', fontWeight: 600, textDecoration: 'none' }}>View All →</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
            {alerts.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0', fontSize: 13 }}>
                <i className="fa-solid fa-circle-check" style={{ fontSize: 28, color: 'var(--success)', marginBottom: 8, display: 'block' }} />
                No active alerts
              </div>
            )}
            {alerts.map((a, i) => (
              <div key={i} className={`alert-card alert-card-${a.severity.toLowerCase()}`}>
                <i className={`fa-solid ${a.severity === 'Danger' ? 'fa-circle-xmark' : a.severity === 'Warning' ? 'fa-triangle-exclamation' : 'fa-circle-info'}`}
                  style={{ color: a.severity === 'Danger' ? 'var(--danger)' : a.severity === 'Warning' ? 'var(--warning)' : 'var(--info)', fontSize: 18, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{a.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Auth Requests (Admin) / Device Quick Control (User) */}
        {userObj.userType === 'Admin' ? (
          <div className="chart-card">
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)', marginBottom: 16 }}>
              <i className="fa-solid fa-user-lock" style={{ color: 'var(--secondary)', marginRight: 8 }} />
              Device Authorization Requests ({authRequests.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto' }}>
              {authRequests.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0', fontSize: 13 }}>
                  <i className="fa-solid fa-inbox" style={{ fontSize: 28, marginBottom: 8, display: 'block' }} />
                  No pending requests
                </div>
              ) : authRequests.map((r, i) => (
                <div key={i} style={{ padding: '12px 14px', background: 'rgba(77,163,255,0.06)', borderRadius: 10, border: '1px solid rgba(77,163,255,0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <strong style={{ fontSize: 13, color: 'var(--primary)' }}>{r.userName}</strong>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(r.date).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                    Device: <strong>{r.deviceName}</strong> · {r.reason}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-success btn-sm" onClick={() => handleRequest(r._id || r.id, 'Approved')}>
                      <i className="fa-solid fa-check" /> Approve
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleRequest(r._id || r.id, 'Rejected')}>
                      <i className="fa-solid fa-xmark" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="chart-card">
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)', marginBottom: 16 }}>
              <i className="fa-solid fa-toggle-on" style={{ color: 'var(--success)', marginRight: 8 }} />
              Quick Device Control
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
              {devices.slice(0, 6).map((d, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(0,0,0,0.02)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: d.state === 1 ? 'rgba(16,185,129,0.12)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className={`fa-solid ${d.imageIcon || 'fa-plug'}`} style={{ color: d.state === 1 ? 'var(--success)' : 'var(--text-muted)', fontSize: 14 }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.location} · {d.currentConsumption?.toFixed(2)} kWh</div>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={d.state === 1} onChange={() => toggleDevice(d._id || d.id, d.state)} />
                    <span className="toggle-slider" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}
