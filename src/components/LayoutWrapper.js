'use client';
import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';

export const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export default function LayoutWrapper({ children, pageTitle }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('sph_token');
    if (!token) {
      router.push('/login');
    }
  }, []);

  function addToast(message, type = 'info') {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4500);
  }

  const toastIcons = { success: 'fa-circle-check', danger: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
  const toastColors = { success: 'var(--success)', danger: 'var(--danger)', warning: 'var(--warning)', info: 'var(--secondary)' };

  return (
    <ToastContext.Provider value={addToast}>
      <div className="page-wrapper">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="main-content">
          <Header onMenuClick={() => setSidebarOpen(p => !p)} pageTitle={pageTitle} />
          <main className="page-body">
            {children}
          </main>
        </div>
      </div>

      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <i className={`fa-solid ${toastIcons[t.type] || 'fa-circle-info'}`} style={{ color: toastColors[t.type] || 'var(--secondary)', fontSize: 16, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>{t.message}</span>
            <button onClick={() => setToasts(p => p.filter(tt => tt.id !== t.id))} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, paddingLeft: 8 }}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
