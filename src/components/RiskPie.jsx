import React from 'react';

function formatNumber(n) {
  return Number(n || 0).toLocaleString();
}

export default function RiskPie({ data }) {
  // data: { LOW, MEDIUM, HIGH }
  const low = data?.LOW || 0;
  const med = data?.MEDIUM || 0;
  const high = data?.HIGH || 0;
  const total = low + med + high || 1;

  const lowPct = (low / total) * 100;
  const medPct = (med / total) * 100;
  const highPct = (high / total) * 100;

  const gradient = `conic-gradient(#4caf50 0% ${lowPct}%, #ffb300 ${lowPct}% ${lowPct + medPct}%, #f44336 ${lowPct + medPct}% 100%)`;

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <div style={{ width: 120, height: 120, borderRadius: '50%', background: gradient, boxShadow: 'inset 0 0 12px rgba(0,0,0,0.06)' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ width: 12, height: 12, background: '#4caf50', display: 'inline-block', borderRadius: 3 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Low</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatNumber(low)} ({lowPct.toFixed(0)}%)</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ width: 12, height: 12, background: '#ffb300', display: 'inline-block', borderRadius: 3 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Medium</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatNumber(med)} ({medPct.toFixed(0)}%)</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ width: 12, height: 12, background: '#f44336', display: 'inline-block', borderRadius: 3 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>High</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatNumber(high)} ({highPct.toFixed(0)}%)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
