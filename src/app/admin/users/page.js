'use client';
import { useState, useEffect } from 'react';
import LayoutWrapper from '@/components/LayoutWrapper';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('sph_token') : '';

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }

  async function updateUserStatus(id, status) {
    await fetch(`/api/admin/users/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    loadUsers();
  }

  async function deleteUser(id) {
    if (!confirm('Delete this user permanently? All their devices and data will be removed.')) return;
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    loadUsers();
  }

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <LayoutWrapper pageTitle="Manage Users">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 20 }}>System Users</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {users.filter(u => u.userType === 'Admin').length} admins · {users.filter(u => u.userType === 'User').length} users · {users.filter(u => u.status === 'Suspended').length} suspended
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <i className="fa-solid fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 13 }} />
            <input
              className="form-input"
              style={{ paddingLeft: 36, width: 240 }}
              placeholder="Search name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Users', value: users.length, icon: 'fa-users', color: '#4DA3FF' },
          { label: 'Active', value: users.filter(u => u.status === 'Active').length, icon: 'fa-circle-check', color: '#10B981' },
          { label: 'Suspended', value: users.filter(u => u.status === 'Suspended').length, icon: 'fa-ban', color: '#EF4444' },
          { label: 'Admins', value: users.filter(u => u.userType === 'Admin').length, icon: 'fa-shield-halved', color: '#8B5CF6' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</span>
              <i className={`fa-solid ${s.icon}`} style={{ color: s.color, fontSize: 18 }} />
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--primary)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="chart-card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40 }}>
                  <div className="spinner" style={{ margin: '0 auto' }} />
                </td></tr>
              ) : filtered.map(u => (
                <tr key={u._id || u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 12 }}>{u.phone || '—'}</td>
                  <td>
                    <span className={`pill ${u.userType === 'Admin' ? 'pill-info' : 'pill-active'}`}>{u.userType}</span>
                  </td>
                  <td>
                    <span className={`pill ${u.status === 'Active' ? 'pill-active' : 'pill-offline'}`}>{u.status}</span>
                  </td>
                  <td style={{ fontSize: 12 }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {u.status === 'Active' ? (
                        <button className="btn btn-secondary btn-sm" onClick={() => updateUserStatus(u._id || u.id, 'Suspended')}>
                          <i className="fa-solid fa-ban" /> Suspend
                        </button>
                      ) : (
                        <button className="btn btn-success btn-sm" onClick={() => updateUserStatus(u._id || u.id, 'Active')}>
                          <i className="fa-solid fa-circle-check" /> Activate
                        </button>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u._id || u.id)}>
                        <i className="fa-regular fa-trash-can" />
                      </button>
                    </div>
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
