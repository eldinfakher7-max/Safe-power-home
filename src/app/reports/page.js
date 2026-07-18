'use client';
import { useState, useEffect } from 'react';
import LayoutWrapper from '@/components/LayoutWrapper';

export default function ReportsPage() {
  const [devices, setDevices] = useState([]);
  const [reports, setReports] = useState([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('sph_token') : '';

  useEffect(() => {
    fetch('/api/devices', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setDevices).catch(() => {});
    fetch('/api/reports/list', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setReports).catch(() => {});
  }, []);

  function exportCSV() {
    const headers = 'Device Name,Type,Location,Power Rating (W),Current Hours,Max Hours,Current kWh,Max kWh,Status\n';
    const rows = devices.map(d =>
      `"${d.name}","${d.type}","${d.location}",${d.powerRating},${d.currentWorkingHours?.toFixed(2)},${d.maxWorkingHours},${d.currentConsumption?.toFixed(3)},${d.maxEnergyConsumption},${d.state === 1 ? 'ON' : 'OFF'}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `SmartPower_Report_${Date.now()}.csv`; a.click();
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(devices, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `SmartPower_Devices_${Date.now()}.json`; a.click();
  }

  const totalConsumption = devices.reduce((s, d) => s + (d.currentConsumption || 0), 0);
  const totalHours = devices.reduce((s, d) => s + (d.currentWorkingHours || 0), 0);
  const activeCount = devices.filter(d => d.state === 1).length;
  const limitExceeded = devices.filter(d => d.currentConsumption >= d.maxEnergyConsumption || d.currentWorkingHours >= d.maxWorkingHours);

  return (
    <LayoutWrapper pageTitle="Reports & Export">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 20 }}>System Reports</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Export consumption data and operational summaries</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={exportCSV}><i className="fa-solid fa-file-csv" /> Export CSV</button>
          <button className="btn btn-primary" onClick={exportJSON}><i className="fa-solid fa-file-code" /> Export JSON</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: "Today's Consumption", value: totalConsumption.toFixed(2), unit: 'kWh', icon: 'fa-calendar-day', color: '#4DA3FF' },
          { label: 'Total Run Hours', value: totalHours.toFixed(1), unit: 'hrs', icon: 'fa-clock', color: '#8B5CF6' },
          { label: 'Active Devices', value: activeCount, icon: 'fa-toggle-on', color: '#10B981' },
          { label: 'Limits Exceeded', value: limitExceeded.length, icon: 'fa-triangle-exclamation', color: '#EF4444' },
          { label: 'Estimated Cost', value: (totalConsumption * 0.18).toFixed(2), unit: 'SAR', icon: 'fa-coins', color: '#F59E0B' },
          { label: 'Monthly Projected', value: (totalConsumption * 30 * 0.18).toFixed(0), unit: 'SAR', icon: 'fa-chart-line', color: '#06B6D4' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</span>
              <i className={`fa-solid ${s.icon}`} style={{ color: s.color, fontSize: 18 }} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--primary)' }}>
              {s.value} <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>{s.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Device consumption table */}
        <div className="chart-card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, color: 'var(--primary)' }}>
            📊 Device Consumption Report
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Device</th>
                  <th>Hours</th>
                  <th>kWh</th>
                  <th>Cost (SAR)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {devices.map(d => {
                  const exceeded = d.currentConsumption >= d.maxEnergyConsumption;
                  return (
                    <tr key={d._id || d.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{d.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{d.location}</div>
                      </td>
                      <td style={{ fontSize: 12, color: d.currentWorkingHours >= d.maxWorkingHours ? 'var(--danger)' : 'var(--text)', fontWeight: d.currentWorkingHours >= d.maxWorkingHours ? 700 : 400 }}>
                        {(d.currentWorkingHours || 0).toFixed(2)}h
                      </td>
                      <td style={{ fontSize: 12, color: exceeded ? 'var(--danger)' : 'var(--text)', fontWeight: exceeded ? 700 : 400 }}>
                        {(d.currentConsumption || 0).toFixed(3)}
                      </td>
                      <td style={{ fontSize: 12 }}>{((d.currentConsumption || 0) * 0.18).toFixed(3)}</td>
                      <td>
                        <span className={`pill ${exceeded ? 'pill-offline' : d.state === 1 ? 'pill-active' : 'pill-closed'}`} style={{ fontSize: 10 }}>
                          {exceeded ? 'Exceeded' : d.state === 1 ? 'Active' : 'Idle'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {devices.length === 0 && (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)', fontSize: 12 }}>No devices found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Reports */}
        <div className="chart-card">
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)', marginBottom: 16 }}>
            🤖 AI System Recommendations
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reports.map((r, i) => (
              <div key={i} style={{ padding: '16px', background: 'var(--accent)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)', marginBottom: 10 }}>{r.title}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                  {r.overload_risk && <div><span style={{ color: '#EF4444', fontWeight: 700 }}>⚡ Overload Risk: </span>{r.overload_risk}</div>}
                  {r.fire_risk && <div><span style={{ color: '#F59E0B', fontWeight: 700 }}>🔥 Fire Risk: </span>{r.fire_risk}</div>}
                  {r.failure_risk && <div><span style={{ color: '#8B5CF6', fontWeight: 700 }}>⚠️ Failure Risk: </span>{r.failure_risk}</div>}
                  {r.recommendations && (
                    <div style={{ marginTop: 8, padding: '10px 12px', background: 'rgba(16,185,129,0.08)', borderRadius: 8, borderLeft: '3px solid var(--success)', color: 'var(--text)', lineHeight: 1.6 }}>
                      <strong style={{ display: 'block', marginBottom: 4 }}>✅ Recommendations:</strong>
                      {r.recommendations.split('\n').map((line, j) => (
                        <div key={j}>{line}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {reports.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                <i className="fa-solid fa-brain" style={{ fontSize: 32, marginBottom: 12, opacity: 0.4, display: 'block' }} />
                No AI reports generated yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
