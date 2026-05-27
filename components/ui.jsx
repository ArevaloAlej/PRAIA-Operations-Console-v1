// Shared UI helpers (modals, status helpers)

function fmtKPI(k) {
  const v = k.value;
  if (k.fmt === 'pct') return v.toFixed(1);
  if (typeof v === 'number') return v % 1 === 0 ? v.toString() : v.toFixed(1);
  return String(v);
}
function unitKPI(k) {
  return k.unit;
}
function kpiStatus(k) {
  const v = k.value, g = k.goal;
  if (k.goalCmp === '≤') return v <= g ? 'ok' : v <= g * 1.15 ? 'warn' : 'bad';
  if (k.goalCmp === '≥') return v >= g ? 'ok' : v >= g * 0.9 ? 'warn' : 'bad';
  if (k.goalCmp === '≈') return Math.abs(v - g) / g <= 0.05 ? 'ok' : Math.abs(v - g) / g <= 0.15 ? 'warn' : 'bad';
  return 'ok';
}
function deltaArrow(d, invert = false) {
  if (Math.abs(d) < 0.1) return { cls: 'flat', sym: '·' };
  const positive = invert ? d < 0 : d > 0;
  return { cls: positive ? 'up' : 'down', sym: d > 0 ? '↑' : '↓' };
}

function Modal({ title, onClose, children, footer, width }) {
  React.useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={width ? { width } : null} onClick={(e) => e.stopPropagation()}>
        <div className="modal-hd">
          <h3>{title}</h3>
          <button className="icon-btn" style={{ marginLeft: 'auto' }} onClick={onClose}>
            <Icon name="x" size={14}/>
          </button>
        </div>
        <div className="modal-bd">{children}</div>
        {footer && <div className="modal-ft">{footer}</div>}
      </div>
    </div>
  );
}

function Stars({ value = 0, max = 5, size = 14, onChange }) {
  return (
    <div className="stars">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`star ${i < value ? 'on' : ''}`}
          style={{ cursor: onChange ? 'pointer' : 'default' }}
          onClick={() => onChange && onChange(i + 1)}>
          <Icon name={i < value ? 'star-fill' : 'star'} size={size}/>
        </span>
      ))}
    </div>
  );
}

function Toast({ msg, onDone }) {
  React.useEffect(() => { const t = setTimeout(onDone, 2400); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="toast">
      <Icon name="check" size={14} style={{ color: 'oklch(0.85 0.16 155)' }}/>
      <span>{msg}</span>
    </div>
  );
}

Object.assign(window, { fmtKPI, unitKPI, kpiStatus, deltaArrow, Modal, Stars, Toast });
