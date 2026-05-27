// Chart primitives — sparkline, area chart, radial dial, heatmap, bars
// All use pure SVG, no libs

function Spark({ data, width = 60, height = 24, color = 'currentColor', fill = false }) {
  if (!data || data.length < 2) return null;
  const mn = Math.min(...data);
  const mx = Math.max(...data);
  const rg = mx - mn || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - 2) + 1;
    const y = height - 2 - ((v - mn) / rg) * (height - 4);
    return [x, y];
  });
  const d = 'M ' + pts.map(p => p.join(' ')).join(' L ');
  const fillD = fill ? d + ` L ${width - 1} ${height - 1} L 1 ${height - 1} Z` : null;
  const gid = 'sp' + Math.random().toString(36).slice(2, 8);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      {fill && (
        <>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.35"/>
              <stop offset="100%" stopColor={color} stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d={fillD} fill={`url(#${gid})`}/>
        </>
      )}
      <path d={d} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function AreaChart({ data, height = 220, color = 'oklch(0.66 0.18 254)', goal, xLabels, yUnit = '', showGoal = true }) {
  const wrapRef = React.useRef(null);
  const [w, setW] = React.useState(600);
  React.useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(es => setW(es[0].contentRect.width));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const padL = 38, padR = 16, padT = 14, padB = 26;
  const innerW = Math.max(50, w - padL - padR);
  const innerH = height - padT - padB;
  const mn = Math.min(...data, goal ?? Infinity) * 0.9;
  const mx = Math.max(...data, goal ?? -Infinity) * 1.1;
  const rg = mx - mn || 1;

  const xy = (i, v) => [padL + (i / (data.length - 1)) * innerW, padT + innerH - ((v - mn) / rg) * innerH];
  const pts = data.map((v, i) => xy(i, v));
  const path = 'M ' + pts.map(p => p.join(' ')).join(' L ');
  const fillP = path + ` L ${padL + innerW} ${padT + innerH} L ${padL} ${padT + innerH} Z`;

  // y ticks
  const yTicks = 4;
  const ticks = [];
  for (let i = 0; i <= yTicks; i++) {
    const v = mn + (rg * i) / yTicks;
    ticks.push({ v, y: padT + innerH - (i / yTicks) * innerH });
  }
  const gid = 'ag' + Math.random().toString(36).slice(2, 8);

  return (
    <div ref={wrapRef} style={{ width: '100%' }}>
      <svg width={w} height={height} style={{ display: 'block' }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={padL} y1={t.y} x2={padL + innerW} y2={t.y} stroke="#1F242E" strokeDasharray={i === 0 ? '' : '2 3'}/>
            <text x={padL - 6} y={t.y + 3} fontSize="10" fill="#5A6273" textAnchor="end" fontFamily="JetBrains Mono, monospace">
              {t.v.toFixed(yUnit === '%' ? 0 : (t.v < 10 ? 1 : 0))}{yUnit}
            </text>
          </g>
        ))}
        {showGoal && goal != null && (
          <>
            <line
              x1={padL} y1={padT + innerH - ((goal - mn) / rg) * innerH}
              x2={padL + innerW} y2={padT + innerH - ((goal - mn) / rg) * innerH}
              stroke="oklch(0.82 0.16 80)" strokeDasharray="4 4" strokeWidth="1"/>
            <text x={padL + innerW - 4} y={padT + innerH - ((goal - mn) / rg) * innerH - 4}
              fontSize="9" fill="oklch(0.82 0.16 80)" textAnchor="end" fontFamily="JetBrains Mono, monospace">
              meta {goal}{yUnit}
            </text>
          </>
        )}
        <path d={fillP} fill={`url(#${gid})`}/>
        <path d={path} stroke={color} strokeWidth="1.75" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 3.5 : 0} fill={color} stroke="#0E1118" strokeWidth="2"/>
        ))}
        {xLabels && xLabels.map((lbl, i) => {
          const xpos = padL + (i / (data.length - 1)) * innerW;
          if (i % Math.ceil(data.length / 8) !== 0 && i !== data.length - 1) return null;
          return <text key={i} x={xpos} y={height - 8} fontSize="10" fill="#5A6273" textAnchor="middle" fontFamily="JetBrains Mono, monospace">{lbl}</text>;
        })}
      </svg>
    </div>
  );
}

function MultiAreaChart({ series, labels, height = 220 }) {
  const wrapRef = React.useRef(null);
  const [w, setW] = React.useState(600);
  React.useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(es => setW(es[0].contentRect.width));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const padL = 38, padR = 16, padT = 14, padB = 26;
  const innerW = Math.max(50, w - padL - padR);
  const innerH = height - padT - padB;
  const all = series.flatMap(s => s.data);
  const mn = Math.min(...all) * 0.9;
  const mx = Math.max(...all) * 1.1;
  const rg = mx - mn || 1;
  const len = series[0].data.length;

  return (
    <div ref={wrapRef} style={{ width: '100%' }}>
      <svg width={w} height={height} style={{ display: 'block' }}>
        {[0,1,2,3,4].map(i => {
          const y = padT + innerH - (i / 4) * innerH;
          return <line key={i} x1={padL} y1={y} x2={padL + innerW} y2={y} stroke="#1F242E" strokeDasharray={i === 0 ? '' : '2 3'}/>;
        })}
        {[0,1,2,3,4].map(i => {
          const v = mn + (rg * i) / 4;
          const y = padT + innerH - (i / 4) * innerH;
          return <text key={i} x={padL - 6} y={y + 3} fontSize="10" fill="#5A6273" textAnchor="end" fontFamily="JetBrains Mono, monospace">{v.toFixed(0)}</text>;
        })}
        {series.map((s, si) => {
          const pts = s.data.map((v, i) => [padL + (i / (len - 1)) * innerW, padT + innerH - ((v - mn) / rg) * innerH]);
          const d = 'M ' + pts.map(p => p.join(' ')).join(' L ');
          return <path key={si} d={d} stroke={s.color} strokeWidth="1.75" fill="none" strokeLinecap="round" strokeLinejoin="round"/>;
        })}
        {labels && labels.map((lbl, i) => {
          if (i % Math.ceil(len / 8) !== 0 && i !== len - 1) return null;
          const x = padL + (i / (len - 1)) * innerW;
          return <text key={i} x={x} y={height - 8} fontSize="10" fill="#5A6273" textAnchor="middle" fontFamily="JetBrains Mono, monospace">{lbl}</text>;
        })}
      </svg>
    </div>
  );
}

function RadialDial({ value = 70, max = 100, size = 140, color = 'oklch(0.66 0.18 254)', label, sublabel, unit = '%' }) {
  const r = size / 2 - 12;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  const off = circ * (1 - pct * 0.75);
  // 270° arc starting from bottom-left
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(135deg)' }}>
        <circle cx={cx} cy={cy} r={r} stroke="#1F242E" strokeWidth="8" fill="none"
          strokeDasharray={`${circ * 0.75} ${circ}`} strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth="8" fill="none"
          strokeDasharray={`${circ * pct * 0.75} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray .6s ease' }}/>
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div className="num" style={{ fontSize: size * 0.22, fontWeight: 600, letterSpacing: '-0.02em' }}>
          {typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(1)) : value}
          <span style={{ fontSize: size * 0.11, color: 'var(--fg-muted)', marginLeft: 2 }}>{unit}</span>
        </div>
        {label && <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: -2 }}>{label}</div>}
        {sublabel && <div style={{ fontSize: 10, color: 'var(--fg-dim)', marginTop: 2 }}>{sublabel}</div>}
      </div>
    </div>
  );
}

function Heatmap({ data, max = 1 }) {
  const colorAt = (v) => {
    if (v < 0.05) return 'rgba(255,255,255,0.04)';
    const t = Math.min(1, v / max);
    return `oklch(${0.32 + t * 0.45} ${0.10 + t * 0.10} 254 / ${0.35 + t * 0.65})`;
  };
  const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '18px 1fr', gap: 4 }}>
        <div style={{ display: 'grid', gridTemplateRows: 'repeat(7, 1fr)', gap: 3, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-dim)' }}>
          {days.map((d, i) => <span key={i} style={{ display: 'flex', alignItems: 'center' }}>{d}</span>)}
        </div>
        <div style={{ display: 'grid', gridTemplateRows: 'repeat(7, 1fr)', gap: 3 }}>
          {data.map((row, ri) => (
            <div key={ri} className="hm" style={{ gridTemplateColumns: 'repeat(24, 1fr)' }}>
              {row.map((v, ci) => (
                <div key={ci} className="hm-cell" style={{ background: colorAt(v) }} title={`${days[ri]} ${ci}:00 — ${Math.round(v * 100)}%`}/>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="hm-labels" style={{ paddingLeft: 22 }}>
        <span>00</span><span>06</span><span>12</span><span>18</span><span>24h</span>
      </div>
    </div>
  );
}

function BarRow({ value, max, color = 'oklch(0.66 0.18 254)', width = 100, height = 6 }) {
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div style={{ width, height, background: 'var(--bg-3)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ width: `${pct * 100}%`, height: '100%', background: color, transition: 'width .4s ease' }}/>
    </div>
  );
}

Object.assign(window, { Spark, AreaChart, MultiAreaChart, RadialDial, Heatmap, BarRow });
