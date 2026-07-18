'use client';
import { useState, useEffect } from 'react';
import LayoutWrapper, { useToast } from '@/components/LayoutWrapper';
import io from 'socket.io-client';

let socket;

const DEVICE_ICONS = [
  { label: '🌬️ Air Conditioner', value: 'fa-wind' },
  { label: '❄️ Refrigerator', value: 'fa-snowflake' },
  { label: '🔥 Water Heater', value: 'fa-faucet-drip' },
  { label: '📺 Television', value: 'fa-tv' },
  { label: '🔋 EV Charger', value: 'fa-car-battery' },
  { label: '💡 Lamp / Lighting', value: 'fa-lightbulb' },
  { label: '🔌 General Outlet', value: 'fa-plug' },
  { label: '🖨️ Computer / PC', value: 'fa-desktop' },
  { label: '🍳 Microwave / Oven', value: 'fa-fire-burner' },
  { label: '🫧 Washing Machine', value: 'fa-shirt' },
];

const DEVICE_TYPES = ['AC', 'Refrigerator', 'Water Heater', 'TV', 'EV Charger', 'Lighting', 'Appliance', 'Computer', 'Washer', 'Other'];

function Modal({ show, onClose, title, children }) {
  if (!show) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h3 style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 16 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)', lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [editDevice, setEditDevice] = useState(null);
  const [requestedName, setRequestedName] = useState('');
  const [alert, setAlert] = useState(null);
  const [user, setUser] = useState(null);

  const [addForm, setAddForm] = useState({ name: '', type: 'AC', location: '', imageIcon: 'fa-plug', powerRating: 1500, maxWorkingHours: 8, maxEnergyConsumption: 10, auth_password: '' });
  const [requestForm, setRequestForm] = useState({ reason: 'New Device Installation', message: '' });

  const token = typeof window !== 'undefined' ? localStorage.getItem('sph_token') : '';

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('sph_user') || '{}');
    setUser(u);
    loadDevices();

    socket = io();
    socket.on('device_metrics_updated', () => loadDevices());
    socket.on('limit_warning_alert', (data) => {
      showAlert(data.message, 'danger');
    });

    return () => { if (socket) socket.disconnect(); };
  }, []);

  async function loadDevices() {
    setLoading(true);
    const res = await fetch('/api/devices', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setDevices(await res.json());
    setLoading(false);
  }

  function showAlert(msg, type = 'success') {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  }

  async function handleAddDevice(e) {
    e.preventDefault();
    const res = await fetch('/api/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(addForm)
    });
    const data = await res.json();

    if (res.ok) {
      setShowAdd(false);
      setAddForm({ name: '', type: 'AC', location: '', imageIcon: 'fa-plug', powerRating: 1500, maxWorkingHours: 8, maxEnergyConsumption: 10, auth_password: '' });
      loadDevices();
      showAlert('Device registered successfully!', 'success');
    } else if (res.status === 403) {
      setShowAdd(false);
      setRequestedName(addForm.name);
      setRequestForm({ reason: 'New Device Installation', message: '' });
      showAlert('Incorrect Device Registration Password.', 'danger');
      setTimeout(() => setShowRequest(true), 600);
    } else {
      showAlert(data.error || 'Failed to add device.', 'danger');
    }
  }

  async function handleEditDevice(e) {
    e.preventDefault();
    const res = await fetch(`/api/devices/${editDevice._id || editDevice.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: editDevice.name,
        type: editDevice.type,
        location: editDevice.location,
        power_rating: editDevice.powerRating,
        max_working_hours: editDevice.maxWorkingHours,
        max_energy_consumption: editDevice.maxEnergyConsumption
      })
    });
    if (res.ok) {
      setShowEdit(false);
      loadDevices();
      showAlert('Device updated successfully!');
    }
  }

  async function submitRequest(e) {
    e.preventDefault();
    const u = JSON.parse(localStorage.getItem('sph_user') || '{}');
    const res = await fetch('/api/admin/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        userName: u.name,
        email: u.email,
        deviceName: requestedName,
        reason: requestForm.reason,
        message: requestForm.message
      })
    });
    if (res.ok) {
      setShowRequest(false);
      showAlert('Access request submitted to Admin.', 'success');
    }
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
    if (!confirm('Remove this device permanently?')) return;
    await fetch(`/api/devices/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    loadDevices();
    showAlert('Device removed.', 'danger');
  }

  async function restartDevice(id) {
    await fetch(`/api/devices/${id}/restart`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    loadDevices();
    showAlert('Device counters reset.');
  }

  return (
    <LayoutWrapper pageTitle="Device Management">
      {/* Alert bar */}
      {alert && (
        <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, background: alert.type === 'success' ? '#DCFCE7' : '#FEE2E2', color: alert.type === 'success' ? '#15803D' : '#DC2626', border: `1px solid ${alert.type === 'success' ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.3)'}` }}>
          <i className={`fa-solid ${alert.type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'}`} />
          {alert.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 20 }}>Smart Devices</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{devices.length} registered channels · {devices.filter(d => d.state === 1).length} active</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <i className="fa-solid fa-plus" /> Add Device
        </button>
      </div>

      {/* Devices Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          Loading devices...
        </div>
      ) : devices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <i className="fa-solid fa-microchip" style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }} />
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No devices registered</div>
          <p style={{ fontSize: 13 }}>Click "Add Device" to register your first smart device.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {devices.map(d => {
            const hoursExceeded = d.currentWorkingHours >= d.maxWorkingHours;
            const energyExceeded = d.currentConsumption >= d.maxEnergyConsumption;
            const hoursPercent = Math.min((d.currentWorkingHours / d.maxWorkingHours) * 100, 100);
            const energyPercent = Math.min((d.currentConsumption / d.maxEnergyConsumption) * 100, 100);

            return (
              <div key={d._id || d.id} className="device-card">
                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: d.state === 1 ? 'rgba(16,185,129,0.12)' : 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition)' }}>
                      <i className={`fa-solid ${d.imageIcon || 'fa-plug'}`} style={{ fontSize: 20, color: d.state === 1 ? 'var(--success)' : 'var(--text-muted)' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)' }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.type} · {d.location}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {(hoursExceeded || energyExceeded) && (
                      <span style={{ fontSize: 16, animation: 'pulse-border 1.5s infinite' }} title="Limit exceeded">⚠️</span>
                    )}
                    <label className="toggle-switch">
                      <input type="checkbox" checked={d.state === 1} onChange={() => toggleDevice(d._id || d.id, d.state)} />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                </div>

                {/* Status pill + power rating */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  <span className={`pill ${d.state === 1 ? 'pill-active' : 'pill-offline'}`}>
                    <i className={`fa-solid ${d.state === 1 ? 'fa-circle' : 'fa-circle-dot'}`} style={{ fontSize: 6 }} />
                    {d.state === 1 ? 'ON' : 'OFF'}
                  </span>
                  <span className="pill pill-info">{d.powerRating}W</span>
                  <span className="pill" style={{ background: 'rgba(139,92,246,0.1)', color: '#7C3AED' }}>{d.type}</span>
                </div>

                {/* Progress Bars */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
                    <span style={{ color: hoursExceeded ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 600 }}>
                      <i className="fa-regular fa-clock" style={{ marginRight: 4 }} />
                      Working Hours
                    </span>
                    <span style={{ color: hoursExceeded ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 700 }}>
                      {d.currentWorkingHours.toFixed(2)} / {d.maxWorkingHours} hrs
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${hoursPercent}%`, background: hoursExceeded ? 'var(--danger)' : hoursPercent > 80 ? 'var(--warning)' : 'var(--success)' }} />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
                    <span style={{ color: energyExceeded ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 600 }}>
                      <i className="fa-solid fa-bolt" style={{ marginRight: 4 }} />
                      Energy Consumption
                    </span>
                    <span style={{ color: energyExceeded ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 700 }}>
                      {d.currentConsumption.toFixed(3)} / {d.maxEnergyConsumption} kWh
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${energyPercent}%`, background: energyExceeded ? 'var(--danger)' : energyPercent > 80 ? 'var(--warning)' : 'var(--secondary)' }} />
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setEditDevice({ ...d }); setShowEdit(true); }} style={{ flex: 1, justifyContent: 'center' }}>
                    <i className="fa-regular fa-pen-to-square" /> Edit
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => restartDevice(d._id || d.id)} style={{ justifyContent: 'center' }} title="Reset counters">
                    <i className="fa-solid fa-rotate" />
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteDevice(d._id || d.id)} style={{ justifyContent: 'center' }}>
                    <i className="fa-regular fa-trash-can" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Device Modal */}
      <Modal show={showAdd} onClose={() => setShowAdd(false)} title="🔌 Register New Smart Device">
        <form onSubmit={handleAddDevice}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Device Name *</label>
              <input className="form-input" placeholder="e.g. Living Room Air Conditioner" value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Device Type</label>
                <select className="form-input" value={addForm.type} onChange={e => setAddForm(p => ({ ...p, type: e.target.value }))}>
                  {DEVICE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Room / Location</label>
                <input className="form-input" placeholder="e.g. Living Room" value={addForm.location} onChange={e => setAddForm(p => ({ ...p, location: e.target.value }))} required />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Device Icon</label>
                <select className="form-input" value={addForm.imageIcon} onChange={e => setAddForm(p => ({ ...p, imageIcon: e.target.value }))}>
                  {DEVICE_ICONS.map(ic => <option key={ic.value} value={ic.value}>{ic.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Power Rating (W)</label>
                <input type="number" className="form-input" value={addForm.powerRating} onChange={e => setAddForm(p => ({ ...p, powerRating: +e.target.value }))} required />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Max Daily Hours</label>
                <input type="number" step="0.1" className="form-input" value={addForm.maxWorkingHours} onChange={e => setAddForm(p => ({ ...p, maxWorkingHours: +e.target.value }))} required />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Max Daily Energy (kWh)</label>
                <input type="number" step="0.1" className="form-input" value={addForm.maxEnergyConsumption} onChange={e => setAddForm(p => ({ ...p, maxEnergyConsumption: +e.target.value }))} required />
              </div>
            </div>
            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '14px' }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--danger)', marginBottom: 6, display: 'block' }}>
                <i className="fa-solid fa-shield-halved" style={{ marginRight: 6 }} />
                Device Authorization Password *
              </label>
              <input type="password" className="form-input" placeholder="Enter registration passcode" value={addForm.auth_password} onChange={e => setAddForm(p => ({ ...p, auth_password: e.target.value }))} required />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Contact your administrator if you don't have the passcode.</div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary"><i className="fa-solid fa-plug" /> Register Device</button>
          </div>
        </form>
      </Modal>

      {/* Access Request Modal */}
      <Modal show={showRequest} onClose={() => setShowRequest(false)} title="🔒 Request Device Access">
        <form onSubmit={submitRequest}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#FFFBEB', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '12px 14px', fontSize: 12, color: '#B45309', fontWeight: 600 }}>
              ⚠️ Incorrect password was entered. Please submit a request to your administrator to grant access.
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Requested Device</label>
              <input className="form-input" value={requestedName} disabled style={{ background: 'rgba(0,0,0,0.04)', opacity: 0.7 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Reason for Request</label>
              <select className="form-input" value={requestForm.reason} onChange={e => setRequestForm(p => ({ ...p, reason: e.target.value }))}>
                <option>New Device Installation</option>
                <option>Hardware Replacement</option>
                <option>Passcode Forgotten</option>
                <option>Urgent System Override</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Detailed Message to Admin</label>
              <textarea className="form-input" rows="3" placeholder="Explain why you need access..." value={requestForm.message} onChange={e => setRequestForm(p => ({ ...p, message: e.target.value }))} required style={{ resize: 'vertical' }} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowRequest(false)}>Close</button>
            <button type="submit" className="btn btn-danger"><i className="fa-solid fa-paper-plane" /> Submit Request</button>
          </div>
        </form>
      </Modal>

      {/* Edit Device Modal */}
      {editDevice && (
        <Modal show={showEdit} onClose={() => setShowEdit(false)} title="✏️ Edit Device Parameters">
          <form onSubmit={handleEditDevice}>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Device Name</label>
                <input className="form-input" value={editDevice.name} onChange={e => setEditDevice(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Type</label>
                  <select className="form-input" value={editDevice.type} onChange={e => setEditDevice(p => ({ ...p, type: e.target.value }))}>
                    {DEVICE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Location</label>
                  <input className="form-input" value={editDevice.location} onChange={e => setEditDevice(p => ({ ...p, location: e.target.value }))} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Power Rating (W)</label>
                  <input type="number" className="form-input" value={editDevice.powerRating} onChange={e => setEditDevice(p => ({ ...p, powerRating: +e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Max Hours/Day</label>
                  <input type="number" step="0.1" className="form-input" value={editDevice.maxWorkingHours} onChange={e => setEditDevice(p => ({ ...p, maxWorkingHours: +e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Max Energy (kWh)</label>
                  <input type="number" step="0.1" className="form-input" value={editDevice.maxEnergyConsumption} onChange={e => setEditDevice(p => ({ ...p, maxEnergyConsumption: +e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary"><i className="fa-solid fa-floppy-disk" /> Save Changes</button>
            </div>
          </form>
        </Modal>
      )}
    </LayoutWrapper>
  );
}
