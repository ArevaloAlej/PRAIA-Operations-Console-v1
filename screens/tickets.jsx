// Tickets — central operational screen
// Table + filters + drawer + new-ticket modal (2 steps)

function Tickets({ go, prefilter }) {
  const { tickets, agents, apartments, issues, platforms, ago, duration, slaProgress, SLA_HOURS } = window.PRAIA;
  const [filter, setFilter] = React.useState(prefilter || 'abiertos');
  const [search, setSearch] = React.useState('');
  const [priorityFilter, setPriorityFilter] = React.useState('all');
  const [selected, setSelected] = React.useState(null);
  const [newOpen, setNewOpen] = React.useState(false);
  const [bulkIds, setBulkIds] = React.useState(new Set());

  const filtered = tickets.filter(t => {
    if (filter === 'abiertos' && t.status === 'cerrado') return false;
    if (filter === 'mios' && t.agent !== 'a1') return false;
    if (filter === 'sla-riesgo' && !(slaProgress(t) >= 70 && t.status !== 'cerrado')) return false;
    if (filter === 'cerrados' && t.status !== 'cerrado') return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!t.id.toLowerCase().includes(s) && !t.description.toLowerCase().includes(s)
          && !t.guest.toLowerCase().includes(s) && !t.apartment.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const counts = {
    abiertos: tickets.filter(t => t.status !== 'cerrado').length,
    mios: tickets.filter(t => t.agent === 'a1').length,
    'sla-riesgo': tickets.filter(t => slaProgress(t) >= 70 && t.status !== 'cerrado').length,
    cerrados: tickets.filter(t => t.status === 'cerrado').length,
    all: tickets.length,
  };

  const toggleBulk = (id) => {
    const n = new Set(bulkIds);
    n.has(id) ? n.delete(id) : n.add(id);
    setBulkIds(n);
  };

  return (
    <div>
      <div className="page-hd">
        <div>
          <h1>Tickets</h1>
          <p>{counts.abiertos} abiertos · {counts['sla-riesgo']} en riesgo SLA · {counts.cerrados} cerrados</p>
        </div>
        <div className="right">
          <button className="btn"><Icon name="download" size={14}/> Exportar</button>
          <button className="btn primary" onClick={() => setNewOpen(true)}>
            <Icon name="plus" size={14}/> Nuevo ticket
          </button>
        </div>
      </div>

      <div className="tabs">
        {[
          ['abiertos', 'Abiertos', counts.abiertos],
          ['mios', 'Asignados a mí', counts.mios],
          ['sla-riesgo', 'En riesgo SLA', counts['sla-riesgo']],
          ['cerrados', 'Cerrados', counts.cerrados],
          ['all', 'Todos', counts.all],
        ].map(([id, lbl, ct]) => (
          <div key={id} className={`tab ${filter === id ? 'active' : ''}`} onClick={() => setFilter(id)}>
            {lbl}<span className="ct">{ct}</span>
          </div>
        ))}
      </div>

      <div className="row" style={{ marginBottom: 14, gap: 8, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '0 0 280px' }}>
          <Icon name="search" size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-dim)' }}/>
          <input className="input" placeholder="Buscar por ID, huésped, apartamento…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: 30 }}/>
        </div>
        <select className="select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} style={{ width: 160 }}>
          <option value="all">Toda prioridad</option>
          <option value="alta">Alta (≤4h)</option>
          <option value="media">Media (≤12h)</option>
          <option value="baja">Baja (≤24h)</option>
        </select>
        <button className="btn ghost sm"><Icon name="filter" size={13}/> Más filtros</button>
        {bulkIds.size > 0 && (
          <div className="row" style={{ marginLeft: 'auto', background: 'var(--accent-soft)', padding: '4px 12px', borderRadius: 'var(--r)' }}>
            <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>{bulkIds.size} seleccionados</span>
            <button className="btn xs" onClick={() => setBulkIds(new Set())}>Limpiar</button>
            <button className="btn xs">Asignar</button>
            <button className="btn xs">Cambiar estado</button>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 30 }}></th>
              <th style={{ width: 88 }}>ID</th>
              <th style={{ width: 36 }}>P</th>
              <th>Descripción</th>
              <th style={{ width: 90 }}>Apto.</th>
              <th>Huésped</th>
              <th style={{ width: 100 }}>Estado</th>
              <th>Agente</th>
              <th style={{ width: 110 }}>SLA</th>
              <th style={{ width: 80 }} className="right">Edad</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan="10" style={{ textAlign: 'center', color: 'var(--fg-muted)', padding: 40 }}>Sin tickets con estos filtros</td></tr>
            )}
            {filtered.slice(0, 40).map(t => {
              const agent = agents.find(a => a.id === t.agent);
              const slaP = slaProgress(t);
              const slaClass = slaP >= 100 ? 'bad' : slaP >= 80 ? 'warn' : 'ok';
              const slaColor = slaClass === 'bad' ? 'var(--crit)' : slaClass === 'warn' ? 'var(--warn)' : 'var(--ok)';
              return (
                <tr key={t.id} className="ticket-row" onClick={() => setSelected(t.id)}>
                  <td onClick={(e) => { e.stopPropagation(); toggleBulk(t.id); }}>
                    <input type="checkbox" checked={bulkIds.has(t.id)} readOnly style={{ accentColor: 'var(--accent)' }}/>
                  </td>
                  <td><span className="tk-id">{t.id}</span></td>
                  <td><div className="prio" data-p={t.priority}><span/><span/><span/></div></td>
                  <td>
                    <div style={{ fontSize: 12.5 }}>{t.description}</div>
                    <div className="muted" style={{ fontSize: 10.5, marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                      {issues.find(i => i.id === t.issue)?.label} · {t.platform}
                    </div>
                  </td>
                  <td><span className="tk-apt">{t.apartment}</span></td>
                  <td>{t.guest}</td>
                  <td><span className={`pill st-${t.status}`}><span className="dot"/>{t.status}</span></td>
                  <td>
                    {agent ? (
                      <div className="row">
                        <div className="av" style={{ background: agent.color, width: 22, height: 22, fontSize: 9.5 }}>{agent.short}</div>
                        <span style={{ fontSize: 12 }}>{agent.name.split(' ')[0]}</span>
                      </div>
                    ) : (
                      <span className="muted" style={{ fontSize: 11.5 }}>— sin asignar</span>
                    )}
                  </td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <div className="tk-sla-bar"><i style={{ width: Math.min(slaP, 100) + '%', background: slaColor }}/></div>
                      <span className="num" style={{ fontSize: 10.5, color: slaColor, fontWeight: 600 }}>{Math.round(slaP)}%</span>
                    </div>
                  </td>
                  <td className="right num muted" style={{ fontSize: 11.5 }}>{ago(t.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && <TicketDrawer ticketId={selected} onClose={() => setSelected(null)}/>}
      {newOpen && <NewTicketModal onClose={() => setNewOpen(false)}/>}
    </div>
  );
}

function TicketDrawer({ ticketId, onClose }) {
  const { tickets, agents, apartments, issues, ago, duration, slaProgress } = window.PRAIA;
  const t = tickets.find(x => x.id === ticketId);
  if (!t) return null;
  const agent = agents.find(a => a.id === t.agent);
  const apt = apartments.find(a => a.id === t.apartment);
  const slaP = slaProgress(t);
  const slaColor = slaP >= 100 ? 'var(--crit)' : slaP >= 80 ? 'var(--warn)' : 'var(--ok)';

  React.useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  const events = [
    { ts: t.createdAt, who: 'Sistema', what: `Ticket creado · prioridad ${t.priority}` },
    ...(t.status !== 'abierto' ? [{ ts: new Date(new Date(t.createdAt).getTime() + 10*60000).toISOString(), who: agent?.name || 'Agente', what: 'Primera respuesta enviada al huésped' }] : []),
    ...(t.agent ? [{ ts: new Date(new Date(t.createdAt).getTime() + 5*60000).toISOString(), who: 'Sistema', what: `Asignado a ${agent?.name || 'agente'}` }] : []),
    { ts: t.updatedAt, who: agent?.name || 'Sistema', what: 'Última actualización registrada' },
    ...(t.closedAt ? [{ ts: t.closedAt, who: agent?.name || 'Sistema', what: 'Ticket cerrado · resolución confirmada' }] : []),
  ].sort((a, b) => new Date(a.ts) - new Date(b.ts));

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose}/>
      <div className="drawer">
        <div className="drawer-hd">
          <div className="row" style={{ marginBottom: 8 }}>
            <span className="num" style={{ fontWeight: 600, fontSize: 14 }}>{t.id}</span>
            <span className={`pill st-${t.status}`}><span className="dot"/>{t.status}</span>
            <div className="prio" data-p={t.priority}><span/><span/><span/></div>
            <span className="chip neut">{t.priority}</span>
            <button className="icon-btn" style={{ marginLeft: 'auto' }} onClick={onClose}>
              <Icon name="x" size={14}/>
            </button>
          </div>
          <h2 className="serif" style={{ fontSize: 19, fontWeight: 500, marginTop: 6 }}>{t.description}</h2>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            {issues.find(i => i.id === t.issue)?.label} · {t.platform} · creado {ago(t.createdAt)}
          </div>
        </div>
        <div className="drawer-bd">
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 18 }}>
            <KV k="Apartamento" v={t.apartment}/>
            <KV k="Edificio" v={apt?.building || '—'}/>
            <KV k="Huésped" v={t.guest}/>
            <KV k="Plataforma" v={t.platform}/>
            <KV k="Creado" v={new Date(t.createdAt).toLocaleString('es-CO')}/>
            <KV k="Actualizado" v={ago(t.updatedAt)}/>
          </div>

          <div className="divider"/>

          <div className="card-hd" style={{ marginBottom: 10 }}>
            <div className="card-title">SLA</div>
            <div className="right">
              <span className="chip" style={{ color: slaColor, background: 'transparent', border: `1px solid currentColor`, fontWeight: 600 }}>
                {slaP >= 100 ? 'Vencido' : slaP >= 80 ? 'En riesgo' : 'Saludable'}
              </span>
            </div>
          </div>
          <div className="tk-sla-bar" style={{ width: '100%', height: 8, marginBottom: 6 }}>
            <i style={{ width: Math.min(slaP, 100) + '%', background: slaColor, height: '100%', display: 'block' }}/>
          </div>
          <div className="row" style={{ justifyContent: 'space-between', fontSize: 11, color: 'var(--fg-muted)' }}>
            <span className="num">{Math.round(slaP)}% del plazo</span>
            <span className="num">Vence {new Date(t.slaDeadline).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}</span>
          </div>

          <div className="divider"/>

          <div className="card-hd" style={{ marginBottom: 10 }}>
            <div className="card-title">Agente</div>
            <button className="btn xs" style={{ marginLeft: 'auto' }}>Reasignar</button>
          </div>
          {agent ? (
            <div className="row" style={{ padding: 12, background: 'var(--bg-inset)', borderRadius: 'var(--r)', gap: 12 }}>
              <div className="av lg" style={{ background: agent.color, width: 42, height: 42, fontSize: 14 }}>{agent.short}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{agent.name}</div>
                <div className="muted" style={{ fontSize: 11.5 }}>{agent.role} · turno {agent.shift}</div>
              </div>
              <button className="btn xs"><Icon name="message" size={12}/> Mensaje</button>
            </div>
          ) : (
            <div style={{ padding: 14, background: 'var(--warn-soft)', color: 'var(--warn)', borderRadius: 'var(--r)', fontSize: 12.5, textAlign: 'center' }}>
              ⚠ Sin agente asignado
            </div>
          )}

          <div className="divider"/>

          <div className="card-hd" style={{ marginBottom: 10 }}>
            <div className="card-title">Actividad</div>
          </div>
          <div style={{ position: 'relative', paddingLeft: 16 }}>
            <div style={{ position: 'absolute', left: 4, top: 4, bottom: 4, width: 1, background: 'var(--border)' }}/>
            <div className="col" style={{ gap: 12 }}>
              {events.map((e, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: -16, top: 4, width: 9, height: 9, borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--bg-1)', boxSizing: 'content-box' }}/>
                  <div style={{ fontSize: 12.5, color: 'var(--fg)' }}>{e.what}</div>
                  <div className="muted" style={{ fontSize: 11, marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                    {e.who} · {ago(e.ts)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="divider"/>

          <div className="field">
            <label>Comentario interno</label>
            <textarea className="textarea" placeholder="Escribe una nota visible solo para el equipo…"/>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn primary"><Icon name="plus" size={13}/> Comentar</button>
            </div>
          </div>

          <div className="divider"/>

          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <button className="btn">Marcar en proceso</button>
            <button className="btn">Marcar en espera</button>
            <button className="btn primary"><Icon name="check" size={13}/> Cerrar ticket</button>
            <button className="btn danger" style={{ marginLeft: 'auto' }}><Icon name="x" size={13}/> Eliminar</button>
          </div>
        </div>
      </div>
    </>
  );
}

function NewTicketModal({ onClose }) {
  const { apartments, issues, platforms } = window.PRAIA;
  const [step, setStep] = React.useState(1);
  const [data, setData] = React.useState({
    apartment: apartments[0].id,
    guest: '',
    platform: 'whatsapp',
    issue: 'limpieza',
    priority: 'media',
    description: '',
  });
  const update = (k, v) => setData(d => ({ ...d, [k]: v }));

  return (
    <Modal title={step === 1 ? 'Nuevo ticket — Datos' : 'Nuevo ticket — Detalle'} onClose={onClose}
      footer={<>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        {step === 1 && <button className="btn primary" onClick={() => setStep(2)}>Continuar <Icon name="chevron-right" size={13}/></button>}
        {step === 2 && (
          <>
            <button className="btn" onClick={() => setStep(1)}><Icon name="chevron-left" size={13}/> Volver</button>
            <button className="btn primary" onClick={onClose}><Icon name="check" size={13}/> Crear ticket</button>
          </>
        )}
      </>}>
      {step === 1 && (
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="field">
            <label>Apartamento</label>
            <select className="select" value={data.apartment} onChange={(e) => update('apartment', e.target.value)}>
              {apartments.map(a => <option key={a.id} value={a.id}>{a.id} · {a.address}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Plataforma</label>
            <select className="select" value={data.platform} onChange={(e) => update('platform', e.target.value)}>
              {platforms.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label>Nombre del huésped</label>
            <input className="input" value={data.guest} onChange={(e) => update('guest', e.target.value)} placeholder="ej. Sarah Johnson"/>
          </div>
          <div className="field">
            <label>Tipo de incidencia</label>
            <select className="select" value={data.issue} onChange={(e) => update('issue', e.target.value)}>
              {issues.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Prioridad</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {['alta', 'media', 'baja'].map(p => (
                <button key={p} type="button"
                  onClick={() => update('priority', p)}
                  className="btn sm" style={{
                    flex: 1,
                    background: data.priority === p ? `var(--pr-${p})` : 'var(--bg-1)',
                    color: data.priority === p ? '#fff' : 'var(--fg)',
                    borderColor: data.priority === p ? `var(--pr-${p})` : 'var(--border)',
                    justifyContent: 'center',
                    fontWeight: data.priority === p ? 600 : 500,
                  }}>
                  {p} · {p === 'alta' ? '4h' : p === 'media' ? '12h' : '24h'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="col" style={{ gap: 14 }}>
          <div className="card" style={{ background: 'var(--bg-inset)' }}>
            <div className="row" style={{ gap: 14, flexWrap: 'wrap' }}>
              <Pair k="Apto" v={data.apartment}/>
              <Pair k="Huésped" v={data.guest || '—'}/>
              <Pair k="Plataforma" v={data.platform}/>
              <Pair k="Incidencia" v={data.issue}/>
              <Pair k="Prioridad" v={data.priority}/>
            </div>
          </div>
          <div className="field">
            <label>Descripción detallada</label>
            <textarea className="textarea" rows="5" value={data.description} onChange={(e) => update('description', e.target.value)}
              placeholder="Describe lo reportado por el huésped — incluye contexto, hora, instrucciones específicas…"/>
          </div>
          <div className="insight">
            <div className="insight-ic" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              <Icon name="info" size={14}/>
            </div>
            <div>
              <b>SLA calculado: {data.priority === 'alta' ? '4 horas' : data.priority === 'media' ? '12 horas' : '24 horas'}</b>
              <p>El ticket será asignado automáticamente al supervisor de turno. Puedes reasignar después de creado.</p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Pair({ k, v }) {
  return (
    <div>
      <div className="muted" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
      <div className="num" style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>{v}</div>
    </div>
  );
}

window.Tickets = Tickets;
