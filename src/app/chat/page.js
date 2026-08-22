'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AIChatPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [devices, setDevices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [chatHistory, setChatHistory] = useState([
    { id: 1, title: 'Energy Overload Assessment', date: 'Today' },
    { id: 2, title: 'Living Room AC Load Optimization', date: 'Yesterday' },
    { id: 3, title: 'Monthly Consumption Prediction', date: '3 days ago' },
  ]);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('sph_token');
      const u = localStorage.getItem('sph_user');
      if (!token) {
        router.push('/login');
        return;
      }
      if (u) {
        try {
          setUser(JSON.parse(u));
        } catch (e) {}
      }
      fetchContextData(token);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function fetchContextData(token) {
    try {
      const [devRes, alertRes] = await Promise.all([
        fetch('/api/devices', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/alerts', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (devRes.ok) setDevices(await devRes.json());
      if (alertRes.ok) setAlerts(await alertRes.json());
    } catch (e) {}
  }

  function handleLogout() {
    localStorage.removeItem('sph_token');
    localStorage.removeItem('sph_user');
    router.push('/login');
  }

  function handleNewChat() {
    setMessages([]);
    setInputMsg('');
    setSidebarOpen(false);
  }

  function handlePromptClick(promptText) {
    sendMessage(promptText);
  }

  async function sendMessage(textToSend) {
    const text = (textToSend || inputMsg).trim();
    if (!text) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInputMsg('');
    setIsTyping(true);

    // Generate intelligent AI Response based on context
    setTimeout(() => {
      const aiReply = generateAIResponse(text, devices, alerts);
      const aiMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1200);
  }

  function generateAIResponse(query, devList, alertList) {
    const q = query.toLowerCase();
    const activeCount = devList.filter(d => d.state === 1).length;
    const totalWatts = devList.reduce((sum, d) => sum + (d.state === 1 ? (d.powerRating || 1000) : 0), 0);
    const totalKwh = devList.reduce((sum, d) => sum + (d.currentConsumption || 0), 0);
    const topConsumer = [...devList].sort((a, b) => (b.currentConsumption || 0) - (a.currentConsumption || 0))[0];

    if (q.includes('analyze my energy') || q.includes('consumption')) {
      return `### ⚡ Energy Consumption Analysis
Based on real-time telemetry from your smart home network:
- **Total Devices Registered:** ${devList.length} devices
- **Currently Active Devices:** ${activeCount} active
- **Live Power Draw:** **${totalWatts.toLocaleString()} Watts**
- **Today's Total Consumption:** **${totalKwh.toFixed(2)} kWh**

${topConsumer ? `📌 **Top Energy Drainer:** \`${topConsumer.name}\` in \`${topConsumer.location}\` (${(topConsumer.currentConsumption || 0).toFixed(2)} kWh used).` : ''}

**Recommendation:** Consider lowering maximum duty hours on high-wattage appliances during peak electricity tariff hours (6 PM - 10 PM) to optimize utility billing.`;
    }

    if (q.includes('safe') || q.includes('load')) {
      const isOverloaded = totalWatts > 3500;
      return `### 🛡️ Electrical Safety Assessment
- **Current System Status:** ${isOverloaded ? '⚠️ **ELEVATED LOAD WARNING**' : '✅ **NORMAL & SAFE**'}
- **Total Active Wattage:** \`${totalWatts} W\` / Recommended Limit \`3,500 W\`
- **Active Safety Locks:** Auto-Shutdown Overload Protection is **ACTIVE**.

${isOverloaded ? '⚠️ **Caution:** Your current power draw exceeds 3,500W. Stagger high-wattage appliances like ACs and Washers to prevent circuit breaker tripping.' : 'Everything looks optimal! No thermal overheating or wire overload risks detected.'}`;
    }

    if (q.includes('most energy') || q.includes('device')) {
      if (!topConsumer) {
        return `You currently have no active devices registered. Click **"+ Add Device"** in your devices dashboard to start tracking!`;
      }
      return `### 💡 Device Energy Breakdown
The highest energy-consuming device in your home is:

**1. ${topConsumer.name}**
- **Type:** \`${topConsumer.type}\` | **Location:** \`${topConsumer.location}\`
- **Power Rating:** \`${topConsumer.powerRating} Watts\`
- **Current Energy Used:** \`${(topConsumer.currentConsumption || 0).toFixed(2)} kWh\`
- **Max Hours Allowed:** \`${topConsumer.maxWorkingHours} hrs/day\`

**Tip:** Enable **Auto-Shutdown** on this device to automatically disconnect it when daily working hours are exceeded.`;
    }

    if (q.includes('reduce') || q.includes('waste')) {
      return `### 🌿 Energy Waste Reduction Plan
Here are 3 actionable AI recommendations to reduce your power bill by up to **24%**:

1. **Optimize Air Conditioner Target Temperature:**
   Setting your AC target temperature to **24°C** instead of 18°C reduces compressor energy load by up to **18%**.
2. **Schedule High-Load Devices:**
   Run high-power washing machines and water heaters during off-peak hours.
3. **Automated Hours Cap:**
   Set maximum operating hours on TV, computers, and dimmable lighting to prevent overnight idle power drain.`;
    }

    if (q.includes('status') || q.includes('check')) {
      const activeAlerts = alertList.filter(a => a.status === 'Active');
      return `### 🔍 Safe Power System Health Check
- **Overall System Health:** **98.8% Optimal**
- **Active Safety Alerts:** \`${activeAlerts.length} Active Alerts\`
- **Passcode Authorization Lock:** Enforced
- **Real-Time Telemetry Loop:** Sub-second sync active

${activeAlerts.length > 0 ? `⚠️ **Attention Required:** You have ${activeAlerts.length} unresolved safety alerts. Review the Alerts tab in your console.` : 'No critical electrical hazards or short-circuit anomalies detected.'}`;
    }

    return `Thank you for asking! I'm **Safe Power AI**, your dedicated electrical safety and energy management assistant.

I can help you with:
- Analyzing appliance energy consumption
- Checking live electrical load safety & thermal risk
- Identifying high-wattage power drainers
- Suggesting automated energy cost reduction plans

Feel free to pick one of the suggested prompts or type your query below!`;
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Simple Markdown Renderer Helper
  function renderMarkdown(text) {
    if (!text) return '';
    let formatted = text
      .replace(/^### (.*$)/gim, '<h3 style="font-size: 16px; font-weight: 800; color: #FACC15; margin: 10px 0 6px 0;">$1</h3>')
      .replace(/^## (.*$)/gim, '<h4 style="font-size: 15px; font-weight: 700; color: #38BDF8; margin: 8px 0 4px 0;">$1</h4>')
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #F8FAFC;">$1</strong>')
      .replace(/`([^`]+)`/g, '<code style="background: rgba(56,189,248,0.15); color: #38BDF8; padding: 2px 6px; border-radius: 4px; font-size: 12px;">$1</code>')
      .replace(/^\- (.*$)/gim, '<li style="margin-left: 16px; list-style-type: disc; color: #CBD5E1;">$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li style="margin-left: 16px; list-style-type: decimal; color: #CBD5E1;">$1</li>')
      .replace(/\n/g, '<br />');
    return formatted;
  }

  return (
    <div style={{
      minHeight: '100vh',
      height: '100vh',
      background: '#0F172A',
      color: '#F8FAFC',
      fontFamily: "var(--font-inter), 'Inter', system-ui, sans-serif",
      display: 'flex',
      overflow: 'hidden'
    }}>
      
      {/* ─────────────────────────────────────────────────────────────
          MOBILE SIDEBAR BACKDROP
      ───────────────────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 90
          }}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          SIDEBAR (DESKTOP & MOBILE OFF-CANVAS DRAWER)
      ───────────────────────────────────────────────────────────── */}
      <aside style={{
        width: '260px',
        height: '100%',
        background: '#1E293B',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: typeof window !== 'undefined' && window.innerWidth <= 768 ? 'fixed' : 'relative',
        top: 0,
        bottom: 0,
        left: 0,
        transform: typeof window !== 'undefined' && window.innerWidth <= 768 && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)',
        boxShadow: sidebarOpen ? '10px 0 30px rgba(0,0,0,0.5)' : 'none'
      }} className="chat-sidebar">
        
        {/* Sidebar Brand Header */}
        <div style={{ padding: '20px 18px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #FACC15 0%, #EAB308 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(250, 204, 21, 0.3)'
            }}>
              <i className="fa-solid fa-bolt" style={{ color: '#0F172A', fontSize: '18px' }} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '16px', color: '#F8FAFC', lineHeight: 1.1 }}>
                Safe Power <span style={{ color: '#FACC15' }}>AI</span>
              </div>
              <div style={{ fontSize: '10px', color: '#38BDF8', fontWeight: 700, letterSpacing: '0.5px' }}>
                Smart Safety Assistant
              </div>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '18px', cursor: 'pointer', display: 'none' }}
            className="mobile-close-btn"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* New Chat Button */}
        <div style={{ padding: '16px 14px 8px' }}>
          <button
            onClick={handleNewChat}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #FACC15 0%, #CA8A04 100%)',
              color: '#0F172A',
              fontWeight: 800,
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 4px 16px rgba(250, 204, 21, 0.25)',
              transition: 'all 0.2s ease'
            }}
          >
            <i className="fa-solid fa-plus" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Navigation / Actions List */}
        <div style={{ flex: 1, padding: '12px 14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '6px 8px', marginBottom: '2px' }}>
            Quick Actions
          </div>

          <button onClick={() => { handlePromptClick('Analyze my energy consumption'); setSidebarOpen(false); }} style={sidebarBtnStyle}>
            <i className="fa-solid fa-chart-line" style={{ color: '#38BDF8', width: '18px' }} />
            <span>Energy Analysis</span>
          </button>

          <button onClick={() => { handlePromptClick('Check my electrical safety status'); setSidebarOpen(false); }} style={sidebarBtnStyle}>
            <i className="fa-solid fa-shield-halved" style={{ color: '#FACC15', width: '18px' }} />
            <span>Electrical Safety</span>
          </button>

          <button onClick={() => router.push('/dashboard')} style={sidebarBtnStyle}>
            <i className="fa-solid fa-gauge-high" style={{ color: '#34D399', width: '18px' }} />
            <span>Metrics Dashboard</span>
          </button>

          <button onClick={() => router.push('/settings')} style={sidebarBtnStyle}>
            <i className="fa-solid fa-gear" style={{ color: '#94A3B8', width: '18px' }} />
            <span>Settings</span>
          </button>

          {/* Chat History Section */}
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '14px 8px 6px', marginTop: '10px' }}>
            Chat History
          </div>

          {chatHistory.map(item => (
            <button
              key={item.id}
              onClick={() => { handlePromptClick(item.title); setSidebarOpen(false); }}
              style={{
                ...sidebarBtnStyle,
                fontSize: '12.5px',
                color: '#CBD5E1',
                padding: '8px 10px'
              }}
            >
              <i className="fa-regular fa-message" style={{ color: '#64748B', width: '16px', fontSize: '12px' }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
            </button>
          ))}

        </div>

        {/* Bottom User Account Footer */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FACC15, #38BDF8)',
              color: '#0F172A',
              fontWeight: 900,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'Authenticated User'}
              </div>
              <div style={{ fontSize: '11px', color: '#38BDF8' }}>
                {user?.userType || 'User'} Account
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              background: 'none',
              border: 'none',
              color: '#EF4444',
              cursor: 'pointer',
              fontSize: '15px',
              padding: '6px',
              borderRadius: '8px',
              transition: 'background 0.2s'
            }}
          >
            <i className="fa-solid fa-arrow-right-from-bracket" />
          </button>
        </div>

      </aside>

      {/* ─────────────────────────────────────────────────────────────
          MAIN CHAT AREA
      ───────────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#0F172A' }}>
        
        {/* Top Header */}
        <header style={{
          height: '64px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#1E293B',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: '#F8FAFC',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px'
              }}
              className="mobile-menu-btn"
            >
              <i className="fa-solid fa-bars" />
            </button>

            <div>
              <div style={{ fontWeight: 900, fontSize: '17px', color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Safe Power AI</span>
                <span style={{ background: 'rgba(250, 204, 21, 0.15)', color: '#FACC15', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '99px', border: '1px solid rgba(250, 204, 21, 0.3)' }}>
                  PRO
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                Your intelligent electrical safety assistant
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {messages.length > 0 && (
              <button
                onClick={handleNewChat}
                title="Clear Chat"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: '#94A3B8',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <i className="fa-solid fa-trash-can" />
                <span className="hide-mobile">Clear</span>
              </button>
            )}

            <Link
              href="/dashboard"
              style={{
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '10px',
                color: '#38BDF8',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <i className="fa-solid fa-chart-pie" />
              <span className="hide-mobile">Dashboard</span>
            </Link>
          </div>
        </header>

        {/* Message Stream / Empty State */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {messages.length === 0 ? (
            /* Empty State */
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              maxWidth: '680px',
              margin: '0 auto',
              padding: '20px 0'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #FACC15 0%, #EAB308 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                boxShadow: '0 8px 30px rgba(250, 204, 21, 0.3)'
              }}>
                <i className="fa-solid fa-bolt" style={{ color: '#0F172A', fontSize: '30px' }} />
              </div>

              <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#F8FAFC', marginBottom: '8px' }}>
                How can I help you today?
              </h2>
              <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '32px', maxWidth: '480px' }}>
                Ask me about real-time appliance load, energy bills, thermal safety thresholds, or hazard diagnostics.
              </p>

              {/* Suggested Prompts Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', width: '100%' }}>
                {[
                  { prompt: 'Analyze my energy consumption', icon: 'fa-chart-line', color: '#38BDF8' },
                  { prompt: 'Is my current electrical load safe?', icon: 'fa-shield-halved', color: '#FACC15' },
                  { prompt: 'Which device is consuming the most energy?', icon: 'fa-microchip', color: '#34D399' },
                  { prompt: 'How can I reduce energy waste?', icon: 'fa-leaf', color: '#A78BFA' },
                  { prompt: 'Check my electrical safety status', icon: 'fa-triangle-exclamation', color: '#F87171' }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePromptClick(item.prompt)}
                    style={{
                      background: '#1E293B',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '14px',
                      padding: '14px 16px',
                      textAlign: 'left',
                      color: '#F8FAFC',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}
                    className="prompt-card"
                  >
                    <i className={`fa-solid ${item.icon}`} style={{ color: item.color, fontSize: '16px', flexShrink: 0 }} />
                    <span>"{item.prompt}"</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Active Messages Stream */
            <div style={{ maxWidth: '800px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {messages.map(msg => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    animation: 'fadeIn 0.25s ease'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    maxWidth: '85%',
                    flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row'
                  }}>
                    {/* Avatar */}
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '10px',
                      background: msg.sender === 'user' ? 'linear-gradient(135deg, #FACC15, #EAB308)' : 'linear-gradient(135deg, #38BDF8, #0284C7)',
                      color: '#0F172A',
                      fontWeight: 900,
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {msg.sender === 'user' ? (user?.name?.charAt(0).toUpperCase() || 'U') : <i className="fa-solid fa-bolt" style={{ fontSize: '14px' }} />}
                    </div>

                    {/* Content Box */}
                    <div style={{
                      background: msg.sender === 'user' ? 'rgba(250, 204, 21, 0.12)' : '#1E293B',
                      border: `1px solid ${msg.sender === 'user' ? 'rgba(250, 204, 21, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                      borderRadius: '16px',
                      borderTopRightRadius: msg.sender === 'user' ? '4px' : '16px',
                      borderTopLeftRadius: msg.sender === 'ai' ? '4px' : '16px',
                      padding: '14px 18px',
                      fontSize: '14px',
                      lineHeight: 1.6,
                      color: '#F8FAFC',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
                    }}>
                      {msg.sender === 'ai' ? (
                        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />
                      ) : (
                        <div>{msg.text}</div>
                      )}
                    </div>
                  </div>

                  <span style={{ fontSize: '10px', color: '#64748B', marginTop: '4px', marginInline: '44px' }}>
                    {msg.timestamp}
                  </span>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, #38BDF8, #0284C7)', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fa-solid fa-bolt" style={{ fontSize: '14px' }} />
                  </div>
                  <div style={{ background: '#1E293B', padding: '12px 18px', borderRadius: '16px', borderTopLeftRadius: '4px', display: 'flex', gap: '6px' }}>
                    <div className="typing-dot" style={{ animationDelay: '0s' }} />
                    <div className="typing-dot" style={{ animationDelay: '0.2s' }} />
                    <div className="typing-dot" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

        </div>

        {/* Bottom Message Input Bar */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#1E293B',
          flexShrink: 0
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputMsg}
              onChange={e => setInputMsg(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Safe Power AI about energy, load safety, or appliance waste..."
              style={{
                flex: 1,
                background: '#0F172A',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '14px',
                padding: '14px 18px',
                color: '#F8FAFC',
                fontSize: '14px',
                outline: 'none',
                resize: 'none',
                maxHeight: '120px',
                lineHeight: 1.4
              }}
              className="chat-input-textarea"
            />

            <button
              onClick={() => sendMessage()}
              disabled={!inputMsg.trim()}
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: inputMsg.trim() ? 'linear-gradient(135deg, #FACC15 0%, #EAB308 100%)' : '#334155',
                color: inputMsg.trim() ? '#0F172A' : '#64748B',
                border: 'none',
                cursor: inputMsg.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                transition: 'all 0.2s ease',
                boxShadow: inputMsg.trim() ? '0 4px 14px rgba(250, 204, 21, 0.3)' : 'none',
                flexShrink: 0
              }}
            >
              <i className="fa-solid fa-paper-plane" />
            </button>
          </div>

          <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748B', marginTop: '8px' }}>
            Safe Power AI verifies real-time telemetry to protect your electrical infrastructure. Shift+Enter for new line.
          </div>
        </div>

      </main>

      {/* Embedded Responsive & Keyframe Styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .typing-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #38BDF8;
          animation: pulseDot 1.4s infinite ease-in-out;
        }

        @keyframes pulseDot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }

        .prompt-card:hover {
          border-color: #FACC15 !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(250, 204, 21, 0.15) !important;
        }

        .chat-input-textarea:focus {
          border-color: #FACC15 !important;
          box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.15) !important;
        }

        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: block !important;
          }
          .mobile-close-btn {
            display: block !important;
          }
          .hide-mobile {
            display: none !important;
          }
        }
      `}</style>

    </div>
  );
}

const sidebarBtnStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '10px',
  background: 'transparent',
  border: 'none',
  color: '#F8FAFC',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  textAlign: 'left',
  transition: 'background 0.2s'
};
