'use client';
import { useState, useEffect, useRef } from 'react';
import LayoutWrapper from '@/components/LayoutWrapper';
import io from 'socket.io-client';

let socket;

export default function ComplaintsPage() {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState('');
  const [user, setUser] = useState(null);
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
    socket.on('complaint_updated', () => loadTickets());

    return () => socket?.disconnect();
  }, []);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadTickets() {
    const res = await fetch('/api/complaints', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setTickets(await res.json());
  }

  async function selectTicket(ticket) {
    if (selected) socket.emit('leave_room', selected.complaintId);
    setSelected(ticket);
    socket.emit('join_room', ticket.complaintId);
    const res = await fetch(`/api/complaints/${ticket.complaintId}/messages`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setMessages(await res.json());
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

  const statusColors = { Open: 'pill-open', 'In Progress': 'pill-inprogress', Resolved: 'pill-resolved', Closed: 'pill-closed' };
  const priorityColors = { Low: 'var(--info)', Medium: 'var(--warning)', High: 'var(--danger)', Critical: '#7C3AED' };

  return (
    <LayoutWrapper pageTitle="My Support Tickets">
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, height: 'calc(100vh - 130px)' }}>
        {/* Ticket list */}
        <div className="chart-card" style={{ overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', padding: 0 }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, color: 'var(--primary)' }}>
            <i className="fa-solid fa-inbox" style={{ marginRight: 8 }} />My Tickets ({tickets.length})
          </div>
          <div style={{ overflowY: 'auto', flex: 1, padding: '8px' }}>
            {tickets.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-ticket" style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }} />
                <div style={{ fontWeight: 600, fontSize: 14 }}>No tickets yet</div>
                <p style={{ fontSize: 12, marginTop: 4 }}>Go to Support to file a new ticket</p>
              </div>
            )}
            {tickets.map(t => (
              <div
                key={t._id || t.id}
                onClick={() => selectTicket(t)}
                style={{ padding: '14px', borderRadius: 10, cursor: 'pointer', marginBottom: 6, border: `1px solid ${selected?.complaintId === t.complaintId ? 'var(--secondary)' : 'transparent'}`, background: selected?.complaintId === t.complaintId ? 'rgba(77,163,255,0.08)' : 'rgba(0,0,0,0.02)', transition: 'var(--transition)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--secondary)', fontFamily: 'monospace' }}>{t.complaintId}</span>
                  <span className={`pill ${statusColors[t.status] || 'pill-info'}`} style={{ fontSize: 10 }}>{t.status}</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: 'var(--text)' }}>{t.subject}</div>
                <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                  <span style={{ color: priorityColors[t.priority], fontWeight: 700 }}>{t.priority}</span>
                  <span>·</span>
                  <span>{t.category}</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{new Date(t.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat pane */}
        {selected ? (
          <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
            {/* Chat header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--accent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--primary)' }}>{selected.subject}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    Ticket: <span style={{ fontFamily: 'monospace', color: 'var(--secondary)' }}>{selected.complaintId}</span>
                    <span style={{ margin: '0 8px' }}>·</span>
                    <span className={`pill ${statusColors[selected.status]}`} style={{ fontSize: 10 }}>{selected.status}</span>
                    <span style={{ margin: '0 8px' }}>·</span>
                    <span style={{ color: priorityColors[selected.priority], fontWeight: 700, fontSize: 11 }}>{selected.priority} Priority</span>
                  </div>
                </div>
              </div>
              {selected.adminReply && (
                <div style={{ marginTop: 10, padding: '10px 12px', background: 'rgba(77,163,255,0.1)', borderRadius: 8, fontSize: 12, color: 'var(--primary)', borderLeft: '3px solid var(--secondary)' }}>
                  <strong>Admin Reply:</strong> {selected.adminReply}
                </div>
              )}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto', fontSize: 13 }}>
                  <i className="fa-regular fa-comment-dots" style={{ fontSize: 32, marginBottom: 8, display: 'block', opacity: 0.4 }} />
                  No messages yet. Start the conversation.
                </div>
              )}
              {messages.map((m, i) => {
                const isMe = m.senderId === user?.id || m.senderId === user?._id;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>{m.senderName}</div>
                    <div className={isMe ? 'chat-bubble chat-bubble-sent' : 'chat-bubble chat-bubble-recv'}>
                      {m.message}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{new Date(m.timestamp).toLocaleTimeString()}</div>
                  </div>
                );
              })}
              <div ref={messagesEnd} />
            </div>

            {/* Message Input */}
            <form onSubmit={sendMsg} style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
              <input className="form-input" value={msg} onChange={e => setMsg(e.target.value)} placeholder="Type your message..." style={{ flex: 1 }} />
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px' }}>
                <i className="fa-solid fa-paper-plane" />
              </button>
            </form>
          </div>
        ) : (
          <div className="chart-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-muted)', height: '100%' }}>
            <i className="fa-solid fa-envelope-open-text" style={{ fontSize: 56, marginBottom: 16, opacity: 0.3 }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Select a Ticket</h3>
            <p style={{ fontSize: 13 }}>Click on any ticket to open the support chat.</p>
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}
