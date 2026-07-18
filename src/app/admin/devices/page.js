'use client';
import { useState, useEffect } from 'react';
import LayoutWrapper from '@/components/LayoutWrapper';

export default function AdminDevicesPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('sph_token') : '';

  useEffect(() => { loadDevices(); }, []);

  async function loadDevices() {
    setLoading(true);
    const res = await fetch('/api/devices', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setDevices(await res.json());
    setLoading(false);
  }

  async function toggleDevice(id, state) {
    await fetch(`/api/devices/${id}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ state: state === 1 ? 0 : 1 })
    });
    loadDevices();
  }

  async function deleteDevice(id) {
    if (!confirm('Delete this device?')) return;
    await fetch(`/api/devices/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    loadDevices();
  }

  const filtered = devices.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.location?.toLowerCase().includes(search.toLowerCase()) ||
    d.type?.toLowerCase().includes(search.toLowerCase())
  );

  const totalConsumption = devices.reduce((s, d) => s + (d.currentConsumption || 0), 0);

  return (
    <LayoutWrapper pageTitle="All Devices">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 20 }}>System Devices</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {devices.filter(d => d.state === 1).length} active · {devices.filter(d => d.state === 0).length} offline · {totalConsumption.toFixed(2)} kWh total consumption
          </p>
        </div>
        <div style={{ position: 'relative' }}>
          <i className="fa-solid fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 13 }} />
          <input className="form-input" style={{ paddingLeft: 36, width: 240 }} placeholder="Search devices..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Devices', value: devices.length, icon: 'fa-microchip', color: '#4DA3FF' },
          { label: 'Active Now', value: devices.filter(d => d.state === 1).length, icon: 'fa-toggle-on', color: '#10B981' },
          { label: 'Offline', value: devices.filter(d => d.state === 0).length, icon: 'fa-toggle-off', color: '#94A3B8' },
          { label: 'Total Consumption', value: totalConsumption.toFixed(2), icon: 'fa-bolt', color: '#F59E0B', unit: 'kWh' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</span>
              <i className={`fa-solid ${s.icon}`} style={{ color: s.color, fontSize: 18 }} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--primary)' }}>
              {s.value} {s.unit && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>{s.unit}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="chart-card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Device</th>
                <th>Type</th>
                <th>Location</th>
                <th>Rating</th>
                <th>Hours Today</th>
                <th>Consumption</th>
                <th>State</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
              ) : filtered.map(d => {
                const hoursOver = d.currentWorkingHours >= d.maxWorkingHours;
                const energyOver = d.currentConsumption >= d.maxEnergyConsumption;
                return (
                  <tr key={d._id || d.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: d.state === 1 ? 'rgba(16,185,129,0.12)' : 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className={`fa-solid ${d.imageIcon || 'fa-plug'}`} style={{ color: d.state === 1 ? 'var(--success)' : 'var(--text-muted)', fontSize: 15 }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{d.name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>{d.type}</td>
                    <td style={{ fontSize: 12 }}>{d.location}</td>
                    <td style={{ fontSize: 12 }}>{d.powerRating}W</td>
                    <td>
                      <span style={{ fontSize: 12, color: hoursOver ? 'var(--danger)' : 'var(--text)', fontWeight: hoursOver ? 700 : 400 }}>
                        {(d.currentWorkingHours || 0).toFixed(2)} / {d.maxWorkingHours}h
                        {hoursOver && <i className="fa-solid fa-triangle-exclamation" style={{ marginLeft: 4, color: 'var(--danger)' }} />}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: energyOver ? 'var(--danger)' : 'var(--text)', fontWeight: energyOver ? 700 : 400 }}>
                        {(d.currentConsumption || 0).toFixed(3)} / {d.maxEnergyConsumption} kWh
                        {energyOver && <i className="fa-solid fa-triangle-exclamation" style={{ marginLeft: 4, color: 'var(--danger)' }} />}
                      </span>
                    </td>
                    <td>
                      <span className={`pill ${d.state === 1 ? 'pill-active' : 'pill-offline'}`}>{d.state === 1 ? 'ON' : 'OFF'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className={`btn btn-sm ${d.state === 1 ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => toggleDevice(d._id || d.id, d.state)}
                          style={{ padding: '5px 10px' }}
                        >
                          <i className={`fa-solid ${d.state === 1 ? 'fa-toggle-off' : 'fa-toggle-on'}`} />
                          {d.state === 1 ? 'OFF' : 'ON'}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteDevice(d._id || d.id)}>
                          <i className="fa-regular fa-trash-can" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </LayoutWrapper>
  );
}
