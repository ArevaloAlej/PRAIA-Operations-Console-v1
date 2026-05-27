// PRAIA Desktop — Componentes comunes reutilizables
// Utilizados en múltiples pantallas

// ─── STAT STRIP (mini card con métrica + icono) ───
function StatStrip({ icon, label, value, sub, color, onClick, disabled }) {
  return (
    <div className="card" onClick={onClick} style={{ cursor: disabled ? 'default' : onClick ? 'pointer' : 'default', opacity: disabled ? 0.5 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: '0 0 36px', height: 36, borderRadius: 'var(--r)', background: color ? `color-mix(in oklch, ${color} 16%, transparent)` : 'var(--bg-2)', display: 'grid', placeItems: 'center', color }}>
          <Icon name={icon} size={16}/>
        </div>
        <div>
          <div className="muted" style={{ fontSize: 11.5 }}>{label}</div>
          <div className="num" style={{ fontWeight: 600, fontSize: 18, marginTop: 2 }}>{value}</div>
          {sub && <div className="dim" style={{ fontSize: 11, marginTop: 2 }}>{sub}</div>}
        </div>
      </div>
    </div>
  );
}

// ─── KV ROW (key-value) ───
function KV({ k, v }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span className="muted" style={{ fontSize: 12 }}>{k}</span>
      <span className="num" style={{ fontWeight: 600, fontSize: 12 }}>{v}</span>
    </div>
  );
}

// ─── BAR ROW (inline bar chart) ───
function BarRow({ value, max, width = '100%', height = 4, color = 'var(--accent)' }) {
  const pct = (value / max) * 100;
  return (
    <div style={{ width, height, background: 'var(--bg-inset)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ width: pct + '%', height: '100%', background: color, transition: 'width 0.3s' }}/>
    </div>
  );
}

// ─── RADIAL DIAL (círculo con valor) ───
function RadialDial({ value, max, size = 160, color = 'var(--accent)', label, sublabel, unit = '' }) {
  const pct = (value / max) * 100;
  const circumference = 2 * Math.PI * (size / 2 - 8);
  const offset = circumference - (pct / 100) * circumference;
  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={size/2-8} fill="none" stroke="var(--bg-2)" strokeWidth="3"/>
        <circle cx={size/2} cy={size/2} r={size/2-8} fill="none" stroke={color} strokeWidth="3" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"/>
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: size * 0.25, lineHeight: 1 }}>{value.toFixed(1)}{unit}</div>
        {label && <div className="muted" style={{ fontSize: size * 0.08, marginTop: size * 0.06 }}>{label}</div>}
        {sublabel && <div className="dim" style={{ fontSize: size * 0.07, marginTop: 2 }}>{sublabel}</div>}
      </div>
    </div>
  );
}

// ─── AREA CHART ───
function AreaChart({ data, xLabels, goal, height = 200, color = 'var(--accent)' }) {
  if (!data.length) return <div style={{ height, background: 'var(--bg-inset)' }}/>;
  const max = Math.max(...data, goal || 0);
  const w = 100 / data.length;
  return (
    <svg viewBox={`0 0 ${data.length * 20} ${height}`} preserveAspectRatio="none" width="100%" height={height} style={{ marginTop: 10 }}>
      {/* Goal line */}
      {goal && (
        <line x1="0" y1={(1 - goal/max) * height} x2={data.length * 20} y2={(1 - goal/max) * height} stroke="var(--fg-muted)" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.5"/>
      )}
      {/* Area */}
      <path d={`M0,${height} ${data.map((v, i) => `L${i * 20 + 10},${(1 - v/max) * height}`).join(' ')} L${(data.length - 1) * 20 + 10},${height}`} fill={color} opacity="0.2"/>
      {/* Line */}
      <polyline points={data.map((v, i) => `${i * 20 + 10},${(1 - v/max) * height}`).join(' ')} fill="none" stroke={color} strokeWidth="1.5"/>
      {/* Dots */}
      {data.map((v, i) => (
        <circle key={i} cx={i * 20 + 10} cy={(1 - v/max) * height} r="1.5" fill={color}/>
      ))}
    </svg>
  );
}

// ─── MULTI-AREA CHART (2+ series) ───
function MultiAreaChart({ series, labels, height = 200 }) {
  if (!series.length || !series[0].data.length) return <div style={{ height, background: 'var(--bg-inset)' }}/>;
  const n = series[0].data.length;
  const maxV = Math.max(...series.flatMap(s => s.data));
  return (
    <svg viewBox={`0 0 ${n * 20} ${height}`} preserveAspectRatio="none" width="100%" height={height}>
      {series.map((s, si) => (
        <React.Fragment key={si}>
          <path d={`M0,${height} ${s.data.map((v, i) => `L${i * 20},${(1 - v/maxV) * height}`).join(' ')} L${(n-1) * 20},${height}`} fill={s.color} opacity="0.15"/>
          <polyline points={s.data.map((v, i) => `${i * 20},${(1 - v/maxV) * height}`).join(' ')} fill="none" stroke={s.color} strokeWidth="1.5"/>
        </React.Fragment>
      ))}
    </svg>
  );
}

Object.assign(window, { StatStrip, KV, BarRow, RadialDial, AreaChart, MultiAreaChart });
