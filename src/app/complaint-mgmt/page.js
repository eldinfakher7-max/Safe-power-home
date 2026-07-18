'use client';
import { useState, useEffect, useRef } from 'react';
import LayoutWrapper from '@/components/LayoutWrapper';
import io from 'socket.io-client';

let socket;

export default function ComplaintMgmtPage() {
  const [tickets, setTickets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState('');
  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState({ status: 'All', priority: 'All', category: 'All', search: '', date: '' });
  const messagesEnd = useRef(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('sph_token') : '';

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('sph_user') || '{}');
    setUser(u);
    loadTickets();

    socket = io();
    socket.on('chat_message', (data) => {
      if (data.complaintId === selected?.complaintId) {
        setMessages(p => [...p, data]);
      }
    });
    socket.on('new_complaint', () => loadTickets());

    return () => socket?.disconnect();
  }, []);

  useEffect(() => {
    let f = [...tickets];
    if (filters.status !== 'All') f = f.filter(t => t.status === filters.status);
    if (filters.priority !== 'All') f = f.filter(t => t.priority === filters.priority);
    if (filters.category !== 'All') f = f.filter(t => t.category === filters.category);
    if (filters.search) f = f.filter(t => t.name?.toLowerCase().includes(filters.search.toLowerCase()) || t.email?.toLowerCase().includes(filters.search.toLowerCase()) || t.subject?.toLowerCase().includes(filters.search.toLowerCase()));
    if (filters.date) f = f.filter(t => new Date(t.createdAt).toISOString().split('T')[0] === filters.date);
    setFiltered(f);
  }, [tickets, filters]);

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function loadTickets() {
    const res = await fetch('/api/complaints', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setTickets(await res.json());
  }

  async function selectTicket(t) {
    if (selected) socket.emit('leave_room', selected.complaintId);
    setSelected(t);
    socket.emit('join_room', t.complaintId);
    const res = await fetch(`/api/complaints/${t.complaintId}/messages`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setMessages(await res.json());
  }

  async function updateStatus(status) {
    await fetch(`/api/complaints/${selected.complaintId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, admin_reply: `Status changed to ${status}.` })
    });
    setSelected(p => ({ ...p, status }));
    loadTickets();
  }

  async function deleteTicket() {
    if (!confirm('Delete this ticket permanently?')) return;
    await fetch(`/api/complaints/${selected.complaintId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setSelected(null);
    loadTickets();
  }

  async function sendMsg(e) {
    e.preventDefault();
    if (!msg.trim() || !selected) return;
    await fetch(`/api/complaints/${selected.complaintId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: msg })
    });
    setMsg('');
  }

  function exportCSV() {
    const headers = 'ID,Subject,Client,Category,Priority,Status,Date\n';
    const rows = filtered.map(t => `"${t.complaintId}","${t.subject}","${t.name}","${t.category}","${t.priority}","${t.status}","${t.createdAt}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'complaints.csv'; a.click();
  }

  const statusColors = { Open: 'pill-open', 'In Progress': 'pill-inprogress', Resolved: 'pill-resolved', Closed: 'pill-closed' };
  const prioColors = { Low: 'var(--info)', Medium: 'var(--warning)', High: 'var(--danger)', Critical: '#7C3AED' };

  return (
    <LayoutWrapper pageTitle="Complaint Management Desk">
      {/* Filters */}
      <div className="chart-card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, alignItems: 'flex-end' }}>
          {[
            { label: 'Status', key: 'status', opts: ['All', 'Open', 'In Progress', 'Resolved', 'Closed'] },
            { label: 'Priority', key: 'priority', opts: ['All', 'Low', 'Medium', 'High', 'Critical'] },
            { label: 'Category', key: 'category', opts: ['All', 'Hardware Failure', 'AI Calibration', 'Power Transient Leakage', 'Billing / Tariff Dispute', 'Device Registration', 'Other'] },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, display: 'block' }}>{f.label}</label>
              <select className="form-input" style={{ padding: '8px 12px', fontSize: 12 }} value={filters[f.key]} onChange={e => setFilters(p => ({ ...p, [f.key]: e.target.value }))}>
                {f.opts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, display: 'block' }}>Date</label>
            <input type="date" className="form-input" style={{ padding: '8px 12px', fontSize: 12 }} value={filters.date} onChange={e => setFilters(p => ({ ...p, date: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, display: 'block' }}>Search</label>
            <input className="form-input" style={{ padding: '8px 12px', fontSize: 12 }} placeholder="Name / Email / Subject..." value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ status: 'All', priority: 'All', category: 'All', search: '', date: '' })}><i className="fa-solid fa-rotate-left" /> Reset</button>
            <button className="btn btn-primary btn-sm" onClick={exportCSV}><i className="fa-solid fa-file-csv" /> Export</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, height: 'calc(100vh - 240px)' }}>
        {/* Ticket list */}
        <div className="chart-card" style={{ overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', padding: 0 }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13, color: 'var(--primary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Tickets ({filtered.length})</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>of {tickets.length} total</span>
          </div>
          <div style={{ overflowY: 'auto', flex: 1, padding: '6px' }}>
            {filtered.map(t => (
              <div key={t._id || t.id} onClick={() => selectTicket(t)}
                style={{ padding: '12px', borderRadius: 10, cursor: 'pointer', marginBottom: 4, border: `1px solid ${selected?.complaintId === t.complaintId ? 'var(--secondary)' : 'transparent'}`, background: selected?.complaintId === t.complaintId ? 'rgba(77,163,255,0.08)' : 'rgba(0,0,0,0.02)', transition: 'var(--transition)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--secondary)', fontFamily: 'monospace' }}>{t.complaintId}</span>
                  <span className={`pill ${statusColors[t.status] || 'pill-info'}`} style={{ fontSize: 10 }}>{t.status}</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 3 }}>{t.subject}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.name} · {t.email}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4, fontSize: 10 }}>
                  <span style={{ color: prioColors[t.priority], fontWeight: 700 }}>{t.priority}</span>
                  <span style={{ color: 'var(--text-muted)' }}>· {t.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat pane */}
        {selected ? (
          <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
            {/* Ticket header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--accent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--primary)' }}>{selected.subject}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {selected.name} ({selected.email}) · <span style={{ fontFamily: 'monospace', color: 'var(--secondary)' }}>{selected.complaintId}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <select className="form-input" style={{ padding: '5px 10px', fontSize: 12, width: 'auto' }} value={selected.status} onChange={e => updateStatus(e.target.value)}>
                    {['Open', 'In Progress', 'Resolved', 'Closed'].map(s => <option key={s}>{s}</option>)}
                  </select>
                  <button className="btn btn-success btn-sm" onClick={() => updateStatus('Resolved')}><i className="fa-solid fa-check" /></button>
                  <button className="btn btn-secondary btn-sm" onClick={() => updateStatus('Closed')}><i className="fa-solid fa-lock" /></button>
                  <button className="btn btn-danger btn-sm" onClick={deleteTicket}><i className="fa-regular fa-trash-can" /></button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto', fontSize: 13 }}>
                  <i className="fa-regular fa-comment-dots" style={{ fontSize: 32, marginBottom: 8, display: 'block', opacity: 0.3 }} />
                  No messages yet
                </div>
              )}
              {messages.map((m, i) => {
                const isMe = m.senderId === user?.id || m.senderId === user?._id;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>{m.senderName}</div>
                    <div className={isMe ? 'chat-bubble chat-bubble-sent' : 'chat-bubble chat-bubble-recv'}>{m.message}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{new Date(m.timestamp).toLocaleTimeString()}</div>
                  </div>
                );
              })}
              <div ref={messagesEnd} />
            </div>

            <form onSubmit={sendMsg} style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
              <input className="form-input" value={msg} onChange={e => setMsg(e.target.value)} placeholder="Type admin response..." style={{ flex: 1 }} />
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px' }}><i className="fa-solid fa-paper-plane" /></button>
            </form>
          </div>
        ) : (
          <div className="chart-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-muted)', height: '100%' }}>
            <i className="fa-solid fa-inbox" style={{ fontSize: 56, marginBottom: 16, opacity: 0.3 }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Select a Complaint</h3>
            <p style={{ fontSize: 13 }}>Click on any ticket to open the admin chat desk.</p>
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}
