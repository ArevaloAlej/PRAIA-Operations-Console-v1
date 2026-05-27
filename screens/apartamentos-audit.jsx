// Apartamentos + Auditoría screens

function Apartamentos({ go }) {
  const { apartments, tickets } = window.PRAIA;
  const [building, setBuilding] = React.useState('all');
  const buildings = ['all', ...new Set(apartments.map(a => a.building))];
  const list = apartments.filter(a => building === 'all' || a.building === building);

  const ticketsByApt = React.useMemo(() => {
    const m = {};
    tickets.forEach(t => {
      if (!m[t.apartment]) m[t.apartment] = { open: 0, closed: 0 };
      if (t.status === 'cerrado') m[t.apartment].closed++; else m[t.apartment].open++;
    });
    return m;
  }, []);

  return (
    <div>
      <div className="page-hd">
        <div>
          <h1>Apartamentos</h1>
          <p>{apartments.length} unidades · {buildings.length - 1} edificios · {tickets.filter(t => t.status !== 'cerrado').length} tickets abiertos</p>
        </div>
        <div className="right">
          <button className="btn"><Icon name="download" size={14}/> Exportar</button>
          <button className="btn primary"><Icon name="plus" size={14}/> Nueva unidad</button>
        </div>
      </div>

      <div className="row" style={{ marginBottom: 14, gap: 6 }}>
        {buildings.map(b => (
          <button key={b}
            className={`btn sm ${building === b ? 'primary' : ''}`}
            onClick={() => setBuilding(b)}>
            {b === 'all' ? 'Todos' : `Edif. ${b}`}
            {b !== 'all' && <span style={{ marginLeft: 6, opacity: 0.7, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              {apartments.filter(a => a.building === b).length}
            </span>}
          </button>
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        {list.map(a => {
          const tk = ticketsByApt[a.id] || { open: 0, closed: 0 };
          return (
            <div key={a.id} className="apt-card">
              <div className="apt-hero">
                <div style={{ flex: 1 }}>
                  <div className="num" style={{ fontSize: 10, color: 'var(--fg-muted)', letterSpacing: '0.06em' }}>EDIFICIO</div>
                  <div className="bld">{a.building}</div>
                </div>
                {tk.open > 0 && (
                  <span className="chip crit" style={{ position: 'absolute', top: 10, right: 10 }}>
                    <span className="dot"/>{tk.open} {tk.open === 1 ? 'ticket' : 'tickets'}
                  </span>
                )}
              </div>
              <div className="apt-body">
                <div className="id">{a.id}</div>
                <div className="title">Unidad {a.id.split('-')[1]}</div>
                <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  <span className="chip neut"><Icon name="users" size={11}/> {a.capacity}</span>
                  <span className="chip neut">{a.beds} hab.</span>
                  <span className="chip neut">{a.baths} baño{a.baths > 1 ? 's' : ''}</span>
                </div>
                <div className="dim" style={{ fontSize: 11, marginBottom: 12 }}>{a.address}</div>
                <div className="row" style={{ justifyContent: 'space-between', fontSize: 11.5 }}>
                  <div>
                    <div className="muted" style={{ fontSize: 10 }}>Abiertos</div>
                    <div className="num" style={{ fontWeight: 600, color: tk.open ? 'var(--crit)' : 'var(--fg)' }}>{tk.open}</div>
                  </div>
                  <div>
                    <div className="muted" style={{ fontSize: 10 }}>Cerrados</div>
                    <div className="num" style={{ fontWeight: 600 }}>{tk.closed}</div>
                  </div>
                  <button className="btn xs">Ver tickets</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────

function Auditoria() {
  const { audit, ago, agents } = window.PRAIA;
  const [filter, setFilter] = React.useState('all');
  const list = audit.filter(a => filter === 'all' || a.action.toLowerCase() === filter);
  const actionColor = {
    CREATE: 'oklch(0.62 0.16 155)',
    UPDATE: 'oklch(0.55 0.18 254)',
    DELETE: 'oklch(0.62 0.22 25)',
    COMMENT: 'oklch(0.68 0.13 210)',
    LOGIN: 'oklch(0.55 0.06 270)',
    'BULK-ASSIGN': 'oklch(0.55 0.18 254)',
  };
  const actionBg = {
    CREATE: 'var(--ok-soft)',
    UPDATE: 'var(--accent-soft)',
    DELETE: 'var(--crit-soft)',
    COMMENT: 'var(--cyan-soft)',
    LOGIN: 'var(--bg-3)',
    'BULK-ASSIGN': 'var(--accent-soft)',
  };

  return (
    <div>
      <div className="page-hd">
        <div>
          <h1>Auditoría</h1>
          <p>{audit.length} eventos registrados · feed cronológico de acciones</p>
        </div>
        <div className="right">
          <button className="btn"><Icon name="filter" size={14}/> Filtros</button>
          <button className="btn"><Icon name="download" size={14}/> Exportar log</button>
        </div>
      </div>

      <div className="tabs">
        {[
          ['all', 'Todos', audit.length],
          ['create', 'Creaciones', audit.filter(a => a.action === 'CREATE').length],
          ['update', 'Actualizaciones', audit.filter(a => a.action === 'UPDATE').length],
          ['comment', 'Comentarios', audit.filter(a => a.action === 'COMMENT').length],
          ['login', 'Inicios de sesión', audit.filter(a => a.action === 'LOGIN').length],
        ].map(([id, lbl, ct]) => (
          <div key={id} className={`tab ${filter === id ? 'active' : ''}`} onClick={() => setFilter(id)}>
            {lbl}<span className="ct">{ct}</span>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 130 }}>Hora</th>
              <th>Actor</th>
              <th style={{ width: 130 }}>Acción</th>
              <th style={{ width: 110 }}>Tabla</th>
              <th>Registro</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {list.map(e => {
              const ag = agents.find(a => a.email === e.actor);
              return (
                <tr key={e.id}>
                  <td className="num muted" style={{ fontSize: 11.5 }}>{ago(e.ts)}</td>
                  <td>
                    <div className="row">
                      {ag && <div className="av" style={{ background: ag.color, width: 22, height: 22, fontSize: 9.5 }}>{ag.short}</div>}
                      <div>
                        <div style={{ fontSize: 12.5 }}>{e.actorName}</div>
                        <div className="dim" style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)' }}>{e.actor}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="chip" style={{ background: actionBg[e.action], color: actionColor[e.action], borderColor: 'transparent' }}>
                      {e.action}
                    </span>
                  </td>
                  <td className="num muted" style={{ fontSize: 11.5 }}>{e.table}</td>
                  <td className="num" style={{ fontSize: 11.5, fontWeight: 600 }}>{e.rowId}</td>
                  <td>
                    {e.delta && (
                      <div style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)' }}>
                        {Object.entries(e.delta).map(([k, val]) => (
                          <span key={k} className="muted">
                            <span style={{ color: 'var(--fg)' }}>{k}</span>:
                            <span style={{ color: 'var(--crit)', margin: '0 4px' }}>{val.from === null ? '∅' : String(val.from)}</span>
                            →
                            <span style={{ color: 'var(--ok)', marginLeft: 4 }}>{val.to === null ? '∅' : String(val.to)}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    {e.payload && (
                      <span className="muted" style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                        {Object.entries(e.payload).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                      </span>
                    )}
                    {!e.delta && !e.payload && <span className="dim">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

Object.assign(window, { Apartamentos, Auditoria });
