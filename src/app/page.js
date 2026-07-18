'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('sph_token');
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px', width: 36, height: 36 }} />
        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Loading Smart Power Home AI...</div>
      </div>
    </div>
  );
}
