// Main App — unified router, RBAC, theme, tweaks

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "role": "admin",
  "accent": "blue",
  "density": "regular",
  "theme": "light",
  "showLogin": false
}/*EDITMODE-END*/;

const ACCENTS = {
  blue:   { primary: 'oklch(0.55 0.18 254)', hi: 'oklch(0.62 0.18 254)', second: 'oklch(0.68 0.13 210)' },
  violet: { primary: 'oklch(0.55 0.20 290)', hi: 'oklch(0.62 0.20 290)', second: 'oklch(0.66 0.16 320)' },
  emerald:{ primary: 'oklch(0.55 0.14 180)', hi: 'oklch(0.62 0.14 180)', second: 'oklch(0.66 0.13 155)' },
  amber:  { primary: 'oklch(0.65 0.16 60)',  hi: 'oklch(0.72 0.15 60)',  second: 'oklch(0.66 0.18 35)' },
};

const DEFAULT_USER = {
  id: 'admin',
  name: 'Ana Carrillo',
  email: 'ana.carrillo@praiahotel.com',
  role: 'Supervisora',
  shift: 'Mañana',
  short: 'AC',
  color: 'oklch(0.62 0.18 254)',
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [authed, setAuthed] = React.useState(!t.showLogin);
  const [role, setRoleState] = React.useState(t.role);
  const [user, setUser] = React.useState(DEFAULT_USER);
  const [route, setRouteState] = React.useState(role === 'admin' ? 'dashboard' : 'tickets');
  const [routeParam, setRouteParam] = React.useState(null);
  const [toast, setToast] = React.useState(null);

  // Theme apply
  React.useEffect(() => {
    document.documentElement.classList.toggle('theme-dark', t.theme === 'dark');
  }, [t.theme]);

  // Density apply
  React.useEffect(() => {
    document.documentElement.classList.remove('density-compact', 'density-comfy');
    if (t.density === 'compact') document.documentElement.classList.add('density-compact');
    if (t.density === 'cozy' || t.density === 'comfy') document.documentElement.classList.add('density-comfy');
  }, [t.density]);

  // Accent apply
  React.useEffect(() => {
    const a = ACCENTS[t.accent] || ACCENTS.blue;
    document.documentElement.style.setProperty('--accent', a.primary);
    document.documentElement.style.setProperty('--accent-hi', a.hi);
    document.documentElement.style.setProperty('--cyan', a.second);
    document.documentElement.style.setProperty('--accent-soft', `color-mix(in oklch, ${a.primary} 10%, transparent)`);
    document.documentElement.style.setProperty('--accent-line', `color-mix(in oklch, ${a.primary} 28%, transparent)`);
    document.documentElement.style.setProperty('--cyan-soft', `color-mix(in oklch, ${a.second} 12%, transparent)`);
  }, [t.accent]);

  const setRole = (r) => {
    setRoleState(r);
    setTweak('role', r);
    if (r === 'user' && !userCanSee(route, r)) setRouteState('tickets');
  };

  const userCanSee = (r, currentRole = role) => {
    if (currentRole === 'admin') return true;
    return ['tickets', 'apartamentos', 'agentes', 'settings'].includes(r);
  };

  const go = (r, p = null) => {
    setRouteState(r);
    setRouteParam(p);
    requestAnimationFrame(() => {
      const c = document.querySelector('.content');
      if (c) c.scrollTop = 0;
    });
  };

  const crumbs = (() => {
    const map = {
      tickets: ['Tickets'],
      apartamentos: ['Apartamentos'],
      dashboard: ['Dashboard'],
      kpis: ['Indicadores'],
      'kpi-detail': ['Indicadores', window.PRAIA.kpis.find(k => k.id === routeParam)?.full || 'KPI'],
      agentes: ['Agentes'],
      'agente-detail': ['Agentes', window.PRAIA.agents.find(a => a.id === routeParam)?.name || 'Agente'],
      qa: ['Calidad / QA'],
      csat: ['CSAT consolidado'],
      correlacion: ['Correlación CSAT ↔ KPIs'],
      'evaluacion-new': ['Calidad / QA', 'Nueva evaluación'],
      reportes: ['Reportes'],
      alertas: ['Alertas'],
      auditoria: ['Auditoría'],
    };
    return map[route] || ['Dashboard'];
  })();

  if (!authed) {
    return (
      <AuthScreen onLogin={({ role: r, user: u }) => {
        setRoleState(r);
        setTweak('role', r);
        setUser(u);
        setAuthed(true);
        setRouteState(r === 'admin' ? 'dashboard' : 'tickets');
      }}/>
    );
  }

  const renderScreen = () => {
    if (!userCanSee(route)) {
      return (
        <div className="user-locked">
          <div className="user-locked-card">
            <div className="lock-ic"><Icon name="lock" size={22}/></div>
            <h2>Módulo restringido</h2>
            <p>Este módulo es exclusivo para usuarios con rol Admin. Si necesitas acceso, contacta a tu supervisor de operaciones.</p>
            <button className="btn primary" style={{ marginTop: 16 }} onClick={() => go('tickets')}>
              Volver a Tickets
            </button>
          </div>
        </div>
      );
    }
    switch (route) {
      case 'tickets':         return <Tickets go={go}/>;
      case 'apartamentos':    return <Apartamentos go={go}/>;
      case 'dashboard':       return <Dashboard go={go}/>;
      case 'kpis':            return <KpisList go={go}/>;
      case 'kpi-detail':      return <KpiDetail kpiId={routeParam} go={go}/>;
      case 'agentes':         return <AgentesList go={go}/>;
      case 'agente-detail':   return <AgenteDetail agentId={routeParam} go={go}/>;
      case 'qa':              return <QAList go={go}/>;
      case 'csat':            return <CSAT go={go}/>;
      case 'correlacion':     return <Correlacion go={go}/>;
      case 'evaluacion-new':  return <EvaluacionForm go={go} onSubmit={(v) => {
                                setToast(`Evaluación de ${v.agent} publicada · score ${v.score}`);
                                go('qa');
                              }}/>;
      case 'reportes':        return <Reportes/>;
      case 'alertas':         return <Alertas/>;
      case 'auditoria':       return <Auditoria/>;
      default:                return role === 'admin' ? <Dashboard go={go}/> : <Tickets go={go}/>;
    }
  };

  return (
    <div className="app">
      <Sidebar route={route} setRoute={go} role={role} user={user}
        onLogout={() => setAuthed(false)}/>
      <div className="main">
        <Topbar
          crumbs={crumbs}
          role={role}
          setRole={setRole}
          theme={t.theme}
          setTheme={(v) => setTweak('theme', v)}
          onAction={(a) => a === 'alerts' && go('alertas')}/>
        <div className="content">
          {renderScreen()}
        </div>
      </div>
      {toast && <Toast msg={toast} onDone={() => setToast(null)}/>}

      <TweaksPanel>
        <TweakSection label="Acceso"/>
        <TweakRadio label="Rol activo" value={role}
          options={['admin', 'user']}
          onChange={(v) => setRole(v)}/>
        <TweakToggle label="Mostrar login" value={t.showLogin}
          onChange={(v) => { setTweak('showLogin', v); if (v) setAuthed(false); }}/>
        <TweakSection label="Apariencia"/>
        <TweakRadio label="Tema" value={t.theme}
          options={['light', 'dark']}
          onChange={(v) => setTweak('theme', v)}/>
        <TweakColorSwatch label="Acento" value={t.accent}
          options={['blue', 'violet', 'emerald', 'amber']}
          onChange={(v) => setTweak('accent', v)}/>
        <TweakRadio label="Densidad" value={t.density}
          options={['compact', 'regular', 'comfy']}
          onChange={(v) => setTweak('density', v)}/>
        <TweakSection label="Atajos"/>
        <TweakButton onClick={() => go('tickets')}>Ir a Tickets</TweakButton>
        <TweakButton onClick={() => go('apartamentos')}>Ver apartamentos</TweakButton>
        <TweakButton onClick={() => go('kpi-detail', 'frt')}>Detalle KPI · FRT</TweakButton>
        <TweakButton onClick={() => go('evaluacion-new')}>Nueva evaluación</TweakButton>
        <TweakButton onClick={() => go('auditoria')}>Ver auditoría</TweakButton>
      </TweaksPanel>
    </div>
  );
}

function TweakColorSwatch({ label, value, options, onChange }) {
  const swatchMap = {
    blue:    'oklch(0.55 0.18 254)',
    violet:  'oklch(0.55 0.20 290)',
    emerald: 'oklch(0.55 0.14 180)',
    amber:   'oklch(0.65 0.16 60)',
  };
  return (
    <div className="twk-row">
      <div className="twk-lbl"><span>{label}</span><span className="twk-val">{value}</span></div>
      <div style={{ display: 'flex', gap: 6 }}>
        {options.map(o => (
          <button key={o}
            onClick={() => onChange(o)}
            style={{
              width: 28, height: 28, borderRadius: 8,
              border: value === o ? '2px solid #29261b' : '1px solid rgba(0,0,0,0.1)',
              background: swatchMap[o] || o,
              cursor: 'pointer', padding: 0,
            }}/>
        ))}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
