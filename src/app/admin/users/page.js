'use client';
import { useState, useEffect } from 'react';
import LayoutWrapper from '@/components/LayoutWrapper';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Admin Reset Password Modal State
  const [resetModalUser, setResetModalUser] = useState(null);
  const [adminVerificationPassword, setAdminVerificationPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

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

  function openResetModal(user) {
    setResetModalUser(user);
    setAdminVerificationPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setResetError('');
    setResetSuccess('');
  }

  function closeResetModal() {
    setResetModalUser(null);
    setAdminVerificationPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setResetError('');
    setResetSuccess('');
  }

  async function handleAdminResetPassword(e) {
    e.preventDefault();
    if (!resetModalUser) return;
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    setResetLoading(true);
    setResetError('');
    setResetSuccess('');

    try {
      const targetId = resetModalUser._id || resetModalUser.id;
      const res = await fetch(`/api/admin/users/${targetId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          adminVerificationPassword,
          newPassword,
          confirmPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        setResetSuccess(data.message || 'User password reset successfully.');
        setTimeout(() => {
          closeResetModal();
          loadUsers();
        }, 1500);
      } else {
        setResetError(data.error || 'Failed to reset user password.');
      }
    } catch (err) {
      setResetError('Connection error. Please try again.');
    } finally {
      setResetLoading(false);
    }
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
                      <button className="btn btn-outline btn-sm" title="Reset Password" onClick={() => openResetModal(u)}>
                        <i className="fa-solid fa-key" /> Reset
                      </button>
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

      {/* Admin Reset Password Modal */}
      {resetModalUser && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border)', borderRadius: 16, width: '100%', maxWidth: 460, padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(201,42,42,0.1)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  <i className="fa-solid fa-user-gear" />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)', margin: 0 }}>Reset User Password</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Admin Authorized Operation</p>
                </div>
              </div>
              <button onClick={closeResetModal} style={{ background: 'none', border: 'none', fontSize: 18, color: 'var(--text-muted)', cursor: 'pointer' }}>
                <i className="fa-solid fa-times" />
              </button>
            </div>

            {/* Target User Details Summary */}
            <div style={{ background: 'var(--accent, rgba(0,0,0,0.03))', borderRadius: 10, padding: '12px 14px', marginBottom: 16, border: '1px solid var(--border)', fontSize: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div><strong style={{ color: 'var(--text-muted)' }}>User Name:</strong> <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{resetModalUser.name}</span></div>
                <div><strong style={{ color: 'var(--text-muted)' }}>Role:</strong> <span>{resetModalUser.userType}</span></div>
                <div><strong style={{ color: 'var(--text-muted)' }}>Email:</strong> <span>{resetModalUser.email}</span></div>
                <div><strong style={{ color: 'var(--text-muted)' }}>Phone:</strong> <span>{resetModalUser.phone || '—'}</span></div>
              </div>
            </div>

            {resetError && (
              <div style={{ background: '#FEE2E2', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#DC2626', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fa-solid fa-triangle-exclamation" />
                {resetError}
              </div>
            )}

            {resetSuccess && (
              <div style={{ background: '#D1FAE5', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#065F46', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fa-solid fa-circle-check" />
                {resetSuccess}
              </div>
            )}

            <form onSubmit={handleAdminResetPassword}>
              {/* Admin Verification Password */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--secondary, #C92A2A)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="fa-solid fa-shield-keyhole" />
                  Admin Verification Password (Required)
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter Admin Verification Password..."
                  value={adminVerificationPassword}
                  onChange={e => setAdminVerificationPassword(e.target.value)}
                  required
                />
              </div>

              {/* New Password */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>New Password for User</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                />
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={closeResetModal} disabled={resetLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={resetLoading}>
                  {resetLoading ? 'Resetting Password...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </LayoutWrapper>
  );
}
