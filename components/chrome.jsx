// Sidebar + Topbar — unified PRAIA Desktop nav

function Sidebar({ route, setRoute, role, user, onLogout }) {
  const isAdmin = role === 'admin';
  // User-visible (operativo cotidiano)
  // Admin-only (KPIs, calidad, reportes, auditoría)
  const nav = [
    { sec: 'Operación' },
    { id: 'tickets',     icon: 'message', label: 'Tickets',          admin: false, count: window.PRAIA.tickets.filter(t => t.status !== 'cerrado').length },
    { id: 'apartamentos', icon: 'home',   label: 'Apartamentos',     admin: false },
    { id: 'agentes',     icon: 'users',   label: 'Agentes ATC',      admin: false },

    { sec: 'KPIs & Calidad', adminOnly: true },
    { id: 'dashboard',   icon: 'chart',   label: 'Dashboard',        admin: true },
    { id: 'kpis',        icon: 'gauge',   label: 'KPIs operativos',  admin: true, count: window.PRAIA.kpis.length },
    { id: 'csat',        icon: 'star',    label: 'CSAT consolidado', admin: true },
    { id: 'correlacion', icon: 'trending-up', label: 'Correlación',  admin: true },
    { id: 'qa',          icon: 'shield',  label: 'Evaluaciones QA',  admin: true, count: window.PRAIA.evaluaciones.length },
    { id: 'evaluacion-new', icon: 'pencil', label: 'Nueva evaluación', admin: true },

    { sec: 'Sistema' },
    { id: 'reportes',    icon: 'file',    label: 'Reportes',         admin: true },
    { id: 'alertas',     icon: 'bell',    label: 'Alertas',          admin: true, count: window.PRAIA.alerts.length },
    { id: 'auditoria',   icon: 'eye',     label: 'Auditoría',        admin: true },
    { id: 'settings',    icon: 'settings',label: 'Configuración',    admin: false, disabled: true },
  ];

  return (
    <aside className="sb">
      <div className="sb-brand">
        <div className="sb-logo">P</div>
        <div className="sb-name">PRAIA<small>Desktop</small></div>
      </div>
      <nav className="sb-nav">
        {nav.map((item, i) => {
          if (item.sec) {
            if (item.adminOnly && !isAdmin) return null;
            return <div key={i} className="sb-section">{item.sec}</div>;
          }
          if (item.admin && !isAdmin) return null;
          const active = route === item.id;
          return (
            <div key={item.id}
              className={`sb-item ${active ? 'active' : ''}`}
              onClick={() => !item.disabled && setRoute(item.id)}
              style={item.disabled ? { opacity: 0.5, cursor: 'not-allowed' } : null}>
              <Icon name={item.icon} className="ic"/>
              <span>{item.label}</span>
              {item.count != null && <span className="badge">{item.count}</span>}
            </div>
          );
        })}
      </nav>
      <div className="sb-foot">
        <div className="sb-user" onClick={onLogout} title="Cerrar sesión">
          <div className="sb-avatar">{user.short}</div>
          <div className="sb-user-meta" style={{ flex: 1, minWidth: 0 }}>
            <b>{user.name}</b>
            <small>{user.email}</small>
          </div>
          <span className={`role-chip ${role}`}>{role}</span>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ crumbs, role, setRole, theme, setTheme, onAction }) {
  return (
    <div className="tb">
      <div className="tb-crumbs">
        <span>PRAIA</span>
        <Icon name="chevron-right" size={14} style={{ color: 'var(--fg-dim)' }}/>
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <Icon name="chevron-right" size={14} style={{ color: 'var(--fg-dim)' }}/>}
            {i === crumbs.length - 1 ? <b>{c}</b> : <span>{c}</span>}
          </React.Fragment>
        ))}
      </div>
      <div className="tb-search-wrap">
        <Icon name="search" size={14} className="ic"/>
        <input className="tb-search" placeholder="Buscar tickets, agentes, KPIs…"/>
        <kbd>⌘K</kbd>
      </div>
      <button className="icon-btn" onClick={() => onAction('alerts')} title="Alertas">
        <Icon name="bell" size={15}/>
        <span className="dot"/>
      </button>
      <button className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Tema">
        <Icon name={theme === 'dark' ? 'sparkles' : 'circle-dot'} size={15}/>
      </button>
      <div style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 4px' }}/>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'var(--bg-inset)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 2 }}>
        <button
          className="btn ghost sm"
          style={{
            background: role === 'admin' ? 'var(--bg-1)' : 'transparent',
            color: role === 'admin' ? 'var(--fg)' : 'var(--fg-muted)',
            height: 24, padding: '0 10px',
            boxShadow: role === 'admin' ? 'var(--sh-1)' : 'none',
          }}
          onClick={() => setRole('admin')}>
          Admin
        </button>
        <button
          className="btn ghost sm"
          style={{
            background: role === 'user' ? 'var(--bg-1)' : 'transparent',
            color: role === 'user' ? 'var(--fg)' : 'var(--fg-muted)',
            height: 24, padding: '0 10px',
            boxShadow: role === 'user' ? 'var(--sh-1)' : 'none',
          }}
          onClick={() => setRole('user')}>
          Usuario
        </button>
      </div>
    </div>
  );
}

window.Sidebar = Sidebar;
window.Topbar = Topbar;
