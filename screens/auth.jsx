// Auth / Login — email + password (SHA-256 simulated)

function AuthScreen({ onLogin }) {
  const { agents } = window.PRAIA;
  const [email, setEmail] = React.useState('ana.carrillo@praiahotel.com');
  const [pwd, setPwd] = React.useState('demo-praia-2026');
  const [role, setRole] = React.useState('admin');
  const [showHint, setShowHint] = React.useState(false);

  const submit = () => {
    // Match against agents list (or default admin user)
    const found = agents.find(a => a.email.toLowerCase() === email.toLowerCase());
    const isSupervisor = found && found.role.toLowerCase().includes('supervis');
    onLogin({
      role: isSupervisor || email === 'ana.carrillo@praiahotel.com' ? role : 'user',
      user: found || { id: 'admin', name: 'Ana Carrillo', email, role: 'Supervisora', shift: 'Mañana', short: 'AC', color: 'oklch(0.62 0.18 254)' },
    });
  };

  return (
    <div className="auth">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="sb-logo">P</div>
          <div>
            <b>PRAIA Desktop</b>
            <small>Operations Console</small>
          </div>
        </div>
        <div className="col" style={{ gap: 14 }}>
          <div className="field">
            <label>Email corporativo</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}/>
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input className="input" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}/>
          </div>
          <div className="field">
            <label>Rol (demo)</label>
            <div style={{ display: 'flex', gap: 0, background: 'var(--bg-inset)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 3 }}>
              <button className="btn ghost sm" style={{
                flex: 1, height: 28,
                background: role === 'admin' ? 'var(--bg-1)' : 'transparent',
                color: role === 'admin' ? 'var(--fg)' : 'var(--fg-muted)',
                boxShadow: role === 'admin' ? 'var(--sh-1)' : 'none',
                justifyContent: 'center',
              }} onClick={() => setRole('admin')}>
                <Icon name="shield" size={12}/> Admin
              </button>
              <button className="btn ghost sm" style={{
                flex: 1, height: 28,
                background: role === 'user' ? 'var(--bg-1)' : 'transparent',
                color: role === 'user' ? 'var(--fg)' : 'var(--fg-muted)',
                boxShadow: role === 'user' ? 'var(--sh-1)' : 'none',
                justifyContent: 'center',
              }} onClick={() => setRole('user')}>
                <Icon name="users" size={12}/> Usuario
              </button>
            </div>
            <div className="dim" style={{ fontSize: 11, marginTop: 2 }}>
              Solo Admin ve Dashboard, KPIs, QA y Auditoría · validación RBAC
            </div>
          </div>
          <button className="btn primary" style={{ height: 38, justifyContent: 'center', marginTop: 4 }} onClick={submit}>
            Iniciar sesión <Icon name="chevron-right" size={14}/>
          </button>
          <div className="row" style={{ justifyContent: 'space-between', marginTop: 4, fontSize: 11.5 }}>
            <span className="muted">Autenticación SHA-256 · sin OAuth</span>
            <button className="btn ghost xs" onClick={() => setShowHint(!showHint)} style={{ fontSize: 11 }}>
              {showHint ? 'Ocultar' : 'Demo accounts'}
            </button>
          </div>
          {showHint && (
            <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 10, fontSize: 11.5, fontFamily: 'var(--font-mono)' }}>
              <div className="muted" style={{ marginBottom: 6 }}>Cuentas demo (cualquier password):</div>
              <div style={{ cursor: 'pointer' }} onClick={() => setEmail('ana.carrillo@praiahotel.com')}>· ana.carrillo@praiahotel.com — Supervisora (Admin)</div>
              <div style={{ cursor: 'pointer' }} onClick={() => setEmail('pedro@praiahotel.com')}>· pedro@praiahotel.com — Agente ATC</div>
              <div style={{ cursor: 'pointer' }} onClick={() => setEmail('zaby@praiahotel.com')}>· zaby@praiahotel.com — Agente ATC</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

window.AuthScreen = AuthScreen;
