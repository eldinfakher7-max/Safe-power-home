'use client';
import { useState, useEffect } from 'react';
import LayoutWrapper from '@/components/LayoutWrapper';

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('Pending');
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});
  const token = typeof window !== 'undefined' ? localStorage.getItem('sph_token') : '';

  useEffect(() => { loadRequests(); }, []);

  async function loadRequests() {
    setLoading(true);
    const res = await fetch('/api/admin/requests', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setRequests(await res.json());
    setLoading(false);
  }

  async function handleAction(id, status) {
    const admin_notes = notes[id] || `${status} by administrator.`;
    await fetch(`/api/admin/requests/${id}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, admin_notes })
    });
    loadRequests();
  }

  const filtered = filter === 'All' ? requests : requests.filter(r => r.status === filter);
  const pending = requests.filter(r => r.status === 'Pending').length;

  return (
    <LayoutWrapper pageTitle="Device Authorization Requests">
      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Pending', value: requests.filter(r => r.status === 'Pending').length, color: '#F59E0B', icon: 'fa-clock' },
          { label: 'Approved', value: requests.filter(r => r.status === 'Approved').length, color: '#10B981', icon: 'fa-circle-check' },
          { label: 'Rejected', value: requests.filter(r => r.status === 'Rejected').length, color: '#EF4444', icon: 'fa-circle-xmark' },
          { label: 'Total Requests', value: requests.length, color: '#4DA3FF', icon: 'fa-inbox' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ borderLeft: `4px solid ${s.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</span>
              <i className={`fa-solid ${s.icon}`} style={{ color: s.color, fontSize: 18 }} />
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--primary)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['All', 'Pending', 'Approved', 'Rejected'].map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)}>
            {f} {f === 'Pending' && pending > 0 && <span style={{ background: 'var(--danger)', color: 'white', borderRadius: 99, fontSize: 10, padding: '1px 6px', marginLeft: 4 }}>{pending}</span>}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="chart-card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>User</th>
                <th>Device Requested</th>
                <th>Reason</th>
                <th>Message</th>
                <th>Status</th>
                <th>Admin Notes</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  <div className="spinner" style={{ margin: '0 auto' }} />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  No requests found.
                </td></tr>
              ) : filtered.map(r => (
                <tr key={r._id || r.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{new Date(r.date).toLocaleDateString()}</td>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{r.userName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.email}</div>
                  </td>
                  <td><strong>{r.deviceName}</strong></td>
                  <td style={{ fontSize: 12 }}>{r.reason}</td>
                  <td style={{ fontSize: 12, maxWidth: 180 }}>{r.message}</td>
                  <td>
                    <span className={`pill ${r.status === 'Pending' ? 'pill-pending' : r.status === 'Approved' ? 'pill-approved' : 'pill-rejected'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    {r.status === 'Pending' ? (
                      <input
                        className="form-input"
                        style={{ padding: '5px 10px', fontSize: 12, minWidth: 140 }}
                        placeholder="Add notes..."
                        value={notes[r._id || r.id] || ''}
                        onChange={e => setNotes(p => ({ ...p, [r._id || r.id]: e.target.value }))}
                      />
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.adminNotes || '—'}</span>
                    )}
                  </td>
                  <td>
                    {r.status === 'Pending' ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-success btn-sm" onClick={() => handleAction(r._id || r.id, 'Approved')}>
                          <i className="fa-solid fa-check" /> Approve
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleAction(r._id || r.id, 'Rejected')}>
                          <i className="fa-solid fa-xmark" /> Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </LayoutWrapper>
  );
}
