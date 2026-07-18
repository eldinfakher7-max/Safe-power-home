'use client';
import { useState, useEffect } from 'react';
import LayoutWrapper from '@/components/LayoutWrapper';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

export default function EnergyPage() {
  const [devices, setDevices] = useState([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('sph_token') : '';

  useEffect(() => {
    fetch('/api/devices', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setDevices);
  }, []);

  const labels7 = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklyData = [12.4, 15.1, 11.8, 18.3, 16.7, 8.2, 13.5];
  const monthlyLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = [320, 295, 340, 380, 410, 390, 360, 425, 405, 360, 310, 290];

  const totalToday = devices.reduce((s, d) => s + d.currentConsumption, 0);
  const topDevice = devices.reduce((best, d) => d.currentConsumption > (best?.currentConsumption || 0) ? d : best, null);

  const devNames = devices.map(d => d.name.length > 12 ? d.name.slice(0, 12) + '…' : d.name);
  const devConsumption = devices.map(d => d.currentConsumption.toFixed(3));

  return (
    <LayoutWrapper pageTitle="Energy Analytics">
      {/* KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: "Today's Usage", value: totalToday.toFixed(2), unit: 'kWh', icon: 'fa-calendar-day', color: '#4DA3FF' },
          { label: 'Weekly Total', value: weeklyData.reduce((a, b) => a + b, 0).toFixed(1), unit: 'kWh', icon: 'fa-calendar-week', color: '#8B5CF6' },
          { label: 'Monthly Total', value: (monthlyData[new Date().getMonth()] || 360).toFixed(0), unit: 'kWh', icon: 'fa-calendar', color: '#F59E0B' },
          { label: 'Most Consuming', value: topDevice?.name || 'N/A', unit: '', icon: 'fa-fire', color: '#EF4444' },
          { label: 'Active Devices', value: devices.filter(d => d.state === 1).length, unit: '', icon: 'fa-toggle-on', color: '#10B981' },
          { label: 'Est. Monthly Cost', value: (totalToday * 30 * 0.18).toFixed(2), unit: 'SAR', icon: 'fa-coins', color: '#06B6D4' },
        ].map(c => (
          <div key={c.label} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{c.label}</span>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: c.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={`fa-solid ${c.icon}`} style={{ color: c.color, fontSize: 14 }} />
              </div>
            </div>
            <div style={{ fontSize: c.label === 'Most Consuming' ? 16 : 26, fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>
              {c.value} <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>{c.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="chart-card">
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)', marginBottom: 16 }}>📅 Weekly Consumption (kWh)</div>
          <div style={{ height: 220 }}>
            <Bar data={{ labels: labels7, datasets: [{ label: 'kWh', data: weeklyData, backgroundColor: ['#4DA3FF','#6BB8FF','#4DA3FF','#1E3A8A','#3B62CE','#4DA3FF','#6BB8FF'], borderRadius: 8, borderSkipped: false }] }}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(0,0,0,0.04)' }, beginAtZero: true } } }} />
          </div>
        </div>
        <div className="chart-card">
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)', marginBottom: 16 }}>📆 Monthly Trend (kWh)</div>
          <div style={{ height: 220 }}>
            <Line data={{ labels: monthlyLabels, datasets: [{ label: 'kWh', data: monthlyData, borderColor: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.1)', fill: true, tension: 0.4, pointRadius: 4, borderWidth: 2.5 }] }}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(0,0,0,0.04)' } } } }} />
          </div>
        </div>
      </div>

      {/* Device breakdown */}
      <div className="grid-2">
        <div className="chart-card">
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)', marginBottom: 16 }}>🔌 Device Consumption Breakdown</div>
          {devices.length > 0 ? (
            <div style={{ height: 220 }}>
              <Bar data={{ labels: devNames, datasets: [{ label: 'kWh', data: devConsumption, backgroundColor: '#4DA3FF', borderRadius: 8 }] }}
                options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(0,0,0,0.04)' }, beginAtZero: true }, y: { grid: { display: false } } } }} />
            </div>
          ) : <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>No device data yet</div>}
        </div>

        <div className="chart-card">
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)', marginBottom: 16 }}>🥧 Consumption by Device Type</div>
          {devices.length > 0 ? (
            <div style={{ height: 220 }}>
              <Doughnut
                data={{
                  labels: [...new Set(devices.map(d => d.type))],
                  datasets: [{
                    data: [...new Set(devices.map(d => d.type))].map(type =>
                      devices.filter(d => d.type === type).reduce((s, d) => s + d.currentConsumption, 0).toFixed(3)
                    ),
                    backgroundColor: ['#4DA3FF', '#1E3A8A', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
                    borderWidth: 0
                  }]
                }}
                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { font: { size: 11 }, boxWidth: 12, padding: 10 } } }, cutout: '60%' }}
              />
            </div>
          ) : <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>No device data yet</div>}
        </div>
      </div>
    </LayoutWrapper>
  );
}
