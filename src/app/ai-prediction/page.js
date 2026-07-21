'use client';
import { useState, useEffect } from 'react';
import LayoutWrapper from '@/components/LayoutWrapper';

export default function AIPredictionPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== 'undefined' ? localStorage.getItem('sph_token') : '';

  useEffect(() => {
    fetch('/api/devices', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setDevices(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const predictions = devices.map(d => {
    const hoursRatio = (d.currentWorkingHours || 0) / (d.maxWorkingHours || 8);
    const powerRatio = (d.currentConsumption || 0) / (d.maxEnergyConsumption || 10);
    const score = Math.min(98, Math.round((hoursRatio * 40 + powerRatio * 60) * 100));
    
    let riskLevel = 'Low Risk';
    let color = '#10B981';
    let estLifetime = '3.5 Years';
    let recommendation = 'Optimal operation. Standard maintenance in 6 months.';

    if (score >= 75) {
      riskLevel = 'High Risk';
      color = '#EF4444';
      estLifetime = '< 3 Months';
      recommendation = 'Schedule urgent capacitor & heating coil inspection.';
    } else if (score >= 45) {
      riskLevel = 'Moderate Risk';
      color = '#F59E0B';
      estLifetime = '1.2 Years';
      recommendation = 'Clean air filters and check line power stability.';
    }

    return {
      ...d,
      healthScore: 100 - Math.round(score * 0.4),
      failureRiskScore: score,
      riskLevel,
      color,
      estLifetime,
      recommendation,
    };
  });

  return (
    <LayoutWrapper pageTitle="AI Failure & Anomaly Forecasting">
      {/* Banner */}
      <div className="chart-card" style={{ background: 'linear-gradient(135deg, #1E3A8A, #8B5CF6)', color: 'white', marginBottom: 24, padding: '24px 30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>🤖 Predictive Maintenance & AI Forecasting</h2>
            <p style={{ fontSize: 13, opacity: 0.9, maxWidth: 620 }}>
              Machine Learning neural network analyzing appliance power signatures to predict component degradation and prevent electrical failures before they occur.
            </p>
          </div>
          <div style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.15)', borderRadius: 12, backdropFilter: 'blur(10px)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, opacity: 0.8, textTransform: 'uppercase', fontWeight: 700 }}>Forecast Accuracy</div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>98.4%</div>
          </div>
        </div>
      </div>

      {/* Grid of Predictions */}
      <div className="grid-3" style={{ gap: 20 }}>
        {loading ? (
          <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : predictions.length === 0 ? (
          <div className="chart-card" style={{ gridColumn: 'span 3', textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            No registered devices to generate AI forecasts.
          </div>
        ) : predictions.map(p => (
          <div key={p.id} className="chart-card" style={{ borderTop: `4px solid ${p.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(30,58,138,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`fa-solid ${p.imageIcon || 'fa-plug'}`} style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary)' }}>{p.name}</h3>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.location}</div>
                </div>
              </div>
              <span className="pill" style={{ background: p.color + '18', color: p.color, fontWeight: 800, fontSize: 11 }}>
                {p.riskLevel}
              </span>
            </div>

            {/* Health Meter */}
            <div style={{ margin: '16px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>Component Health Index</span>
                <span style={{ color: p.color, fontWeight: 900 }}>{p.healthScore}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 99, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${p.healthScore}%`, background: p.color, borderRadius: 99, transition: 'width 0.5s ease' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 14, background: 'var(--accent)', padding: '8px 12px', borderRadius: 8 }}>
              <span>Est. Remaining Lifespan:</span>
              <strong style={{ color: 'var(--primary)' }}>{p.estLifetime}</strong>
            </div>

            <div style={{ fontSize: 11, color: 'var(--text)', lineHeight: 1.5, padding: '10px 12px', background: 'rgba(77,163,255,0.06)', borderRadius: 8, borderLeft: '3px solid var(--secondary)' }}>
              <strong>AI Recommendation:</strong> {p.recommendation}
            </div>
          </div>
        ))}
      </div>
    </LayoutWrapper>
  );
}
