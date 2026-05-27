// Supporting screens: KPIs list, Agentes, Agente detail, QA list, Reportes, Alertas

function KpisList({ go }) {
  const { kpis, makeSeries } = window.PRAIA;
  const [filter, setFilter] = React.useState('all');
  const buckets = {
    all: kpis,
    operativo: kpis.filter(k => ['frt', 'art', 'sla', 'resp', 'esc', 'occ'].includes(k.id)),
    calidad:   kpis.filter(k => ['qa', 'fcr', 'csat'].includes(k.id)),
    productividad: kpis.filter(k => ['vol', 'prod', 'eff'].includes(k.id)),
  };
  const list = buckets[filter];

  return (
    <div>
      <div className="page-hd">
        <div>
          <h1>Indicadores</h1>
          <p>{kpis.length} KPIs activos · refresco automático cada 60s</p>
        </div>
        <div className="right">
          <button className="btn"><Icon name="plus" size={14}/> Nuevo KPI</button>
          <button className="btn primary"><Icon name="settings" size={14}/> Configurar fórmulas</button>
        </div>
      </div>

      <div className="tabs">
        {[
          ['all', 'Todos', kpis.length],
          ['operativo', 'Operativos', buckets.operativo.length],
          ['calidad', 'Calidad', buckets.calidad.length],
          ['productividad', 'Productividad', buckets.productividad.length],
        ].map(([id, lbl, ct]) => (
          <div key={id} className={`tab ${filter === id ? 'active' : ''}`} onClick={() => setFilter(id)}>
            {lbl}<span className="ct">{ct}</span>
          </div>
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {list.map(k => {
          const st = kpiStatus(k);
          const inv = k.goalCmp === '≤';
          const da = deltaArrow(k.delta, inv);
          const pct = k.goalCmp === '≤'
            ? Math.max(0, Math.min(100, (k.goal / k.value) * 100))
            : Math.max(0, Math.min(100, (k.value / k.goal) * 100));
          const series = makeSeries(k.sparkSeed, 14, k.value, k.value * 0.12);
          return (
            <div key={k.id} className="kpi" onClick={() => go('kpi-detail', k.id)}>
              <div className="kpi-label">
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: st === 'ok' ? 'oklch(0.78 0.16 155)' : st === 'warn' ? 'oklch(0.82 0.16 80)' : 'oklch(0.78 0.20 25)',
                }}/>
                {k.full}
              </div>
              <div className="kpi-val">
                {fmtKPI(k)}<span className="unit">{unitKPI(k)}</span>
              </div>
              <div className="kpi-row">
                <span className={`delta ${da.cls}`}>{da.sym} {Math.abs(k.delta).toFixed(1)}{k.fmt === 'pct' ? 'pp' : '%'}</span>
                <span className="kpi-meta">meta {k.goalCmp} {k.goal}{k.unit}</span>
              </div>
              <div className="kpi-bar"><i className={st} style={{ width: pct + '%' }}/></div>
              <div className="kpi-spark">
                <Spark data={series}
                  color={st === 'ok' ? 'oklch(0.78 0.16 155)' : st === 'warn' ? 'oklch(0.82 0.16 80)' : 'oklch(0.78 0.20 25)'}
                  fill width={60} height={26}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────

function AgentesList({ go }) {
  const { agents } = window.PRAIA;
  const [sort, setSort] = React.useState('rank');
  const [team, setTeam] = React.useState('all');
  const teams = ['all', ...new Set(agents.map(a => `${a.role} · ${a.shift}`))];
  const sorted = [...agents]
    .filter(a => team === 'all' || `${a.role} · ${a.shift}` === team)
    .sort((a, b) => sort === 'rank' ? (b.qa - a.qa)
      : sort === 'qa' ? b.qa - a.qa
      : sort === 'sla' ? a.frt - b.frt
      : a.name.localeCompare(b.name));

  return (
    <div>
      <div className="page-hd">
        <div>
          <h1>Agentes ATC</h1>
          <p>{agents.length} agentes activos · Pedro y Zaby · supervisora Ana Carrillo</p>
        </div>
        <div className="right">
          <button className="btn"><Icon name="download" size={14}/> Exportar lista</button>
          <button className="btn primary"><Icon name="plus" size={14}/> Agregar agente</button>
        </div>
      </div>

      <div className="row" style={{ marginBottom: 14, gap: 8 }}>
        <select className="select" value={team} onChange={(e) => setTeam(e.target.value)} style={{ width: 220 }}>
          {teams.map(t => <option key={t} value={t}>{t === 'all' ? 'Todos los equipos' : t}</option>)}
        </select>
        <select className="select" value={sort} onChange={(e) => setSort(e.target.value)} style={{ width: 200 }}>
          <option value="rank">Ordenar por calidad</option>
          <option value="qa">Ordenar por QA</option>
          <option value="sla">Ordenar por FRT</option>
          <option value="name">Ordenar por nombre</option>
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn ghost sm"><Icon name="filter" size={13}/> Filtros</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Agente</th>
              <th>Rol</th>
              <th>Turno</th>
              <th className="right">Calidad</th>
              <th className="right">FRT</th>
              <th className="right">ART</th>
              <th className="right">FCR</th>
              <th className="right">Vol</th>
              <th className="right">Esc.</th>
              <th style={{ width: 120 }}>CSAT</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(a => (
              <tr key={a.id} onClick={() => go('agente-detail', a.id)} style={{ cursor: 'pointer' }}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="av" style={{ background: a.color }}>{a.short}</div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{a.name}</div>
                      <div className="dim" style={{ fontSize: 10.5 }}>{a.id.toUpperCase()}</div>
                    </div>
                  </div>
                </td>
                <td className="muted">{a.role}</td>
                <td><span className="chip neut">{a.shift}</span></td>
                <td className="right num" style={{ fontWeight: 600 }}>
                  <span className={`chip ${a.qa >= 3.5 ? 'ok' : a.qa >= 3 ? 'info' : 'warn'}`}>{a.qa.toFixed(1)}/4</span>
                </td>
                <td className="right num" style={{ color: a.frt < 5 ? 'var(--ok)' : 'var(--crit)' }}>{a.frt.toFixed(1)} min</td>
                <td className="right num" style={{ color: a.art < 10 ? 'var(--ok)' : 'var(--crit)' }}>{a.art.toFixed(1)} min</td>
                <td className="right num">{a.fcr}%</td>
                <td className="right num">{a.vol}</td>
                <td className="right num" style={{ color: a.esc <= 10 ? 'var(--ok)' : 'var(--crit)' }}>{a.esc}%</td>
                <td><BarRow value={a.csat} max={100} width={100} color={a.csat >= 85 ? 'var(--ok)' : a.csat >= 75 ? 'var(--accent)' : 'var(--warn)'}/></td>
                <td><Icon name="chevron-right" size={14} style={{ color: 'var(--fg-dim)' }}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────

function AgenteDetail({ agentId, go }) {
  const { agents, evaluaciones, makeSeries } = window.PRAIA;
  const a = agents.find(x => x.id === agentId) || agents[0];
  const evals = evaluaciones.filter(e => e.agentId === a.id);
  const qaTrend = React.useMemo(() => makeSeries(a.qa, 12, a.qa, 8), [a.id]);
  const slaTrend = React.useMemo(() => makeSeries(a.sla * 10, 12, a.sla, 4), [a.id]);

  return (
    <div>
      <div className="page-hd">
        <div>
          <div className="row" style={{ fontSize: 12.5, color: 'var(--fg-muted)', marginBottom: 4 }}>
            <span onClick={() => go('agentes')} style={{ cursor: 'pointer' }}>Agentes</span>
            <Icon name="chevron-right" size={12}/>
            <span style={{ color: 'var(--fg)' }}>{a.name}</span>
          </div>
          <div className="row" style={{ gap: 16 }}>
            <div className="av lg" style={{ background: a.color }}>{a.short}</div>
            <div>
              <h1 style={{ fontSize: 22 }}>{a.name}</h1>
              <p>{a.role} · turno {a.shift} · {a.email}</p>
            </div>
          </div>
        </div>
        <div className="right">
          <button className="btn"><Icon name="message" size={14}/> Mensaje interno</button>
          <button className="btn primary" onClick={() => go('evaluacion-new')}>
            <Icon name="pencil" size={14}/> Nueva evaluación
          </button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 'var(--gap)' }}>
        <MiniStat label="Calidad" val={a.qa.toFixed(1)} unit="/4" color="var(--accent)" goal={3.5} dir="up"/>
        <MiniStat label="FRT" val={a.frt.toFixed(1)} unit="min" color="var(--ok)" goal={5} dir="down"/>
        <MiniStat label="ART" val={a.art.toFixed(1)} unit="min" color="var(--cyan)" goal={10} dir="down"/>
        <MiniStat label="FCR" val={a.fcr} unit="%" color="oklch(0.62 0.16 290)" goal={70} dir="up"/>
        <MiniStat label="Escalación" val={a.esc} unit="%" color="var(--warn)" goal={10} dir="down"/>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr', marginBottom: 'var(--gap)' }}>
        <div className="card">
          <div className="card-hd">
            <div className="card-title">Evolución 12 semanas</div>
            <div className="right" style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--fg-muted)' }}>
              <span><span style={{ display: 'inline-block', width: 10, height: 2, background: 'oklch(0.66 0.18 254)', marginRight: 5, verticalAlign: 'middle' }}/>QA</span>
              <span><span style={{ display: 'inline-block', width: 10, height: 2, background: 'oklch(0.84 0.13 200)', marginRight: 5, verticalAlign: 'middle' }}/>SLA</span>
            </div>
          </div>
          <MultiAreaChart
            series={[
              { data: qaTrend, color: 'var(--accent)' },
              { data: slaTrend, color: 'var(--cyan)' },
            ]}
            labels={Array.from({ length: 12 }, (_, i) => `s${i + 1}`)}
            height={220}/>
        </div>
        <div className="card">
          <div className="card-hd">
            <div className="card-title">Ranking</div>
          </div>
          <div className="ring-wrap">
            <RadialDial value={a.qa}
              max={4} size={140}
              color={a.qa >= 3.5 ? 'var(--ok)' : 'var(--warn)'}
              label="Calidad promedio"
              sublabel={`${a.eval_count} evaluaciones`}
              unit="/4"/>
          </div>
          <div className="divider"/>
          <div className="col" style={{ gap: 8 }}>
            <KV k="Tasa de respuesta" v={`${a.resp}%`}/>
            <KV k="Volumen mensajes" v={`${a.vol}/turno`}/>
            <KV k="CSAT consolidado" v={`${a.csat}/100`}/>
            <KV k="Plataformas" v="Guesty + WhatsApp"/>
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-hd" style={{ padding: 'var(--pad) var(--pad) 0' }}>
            <div>
              <div className="card-title">Historial de evaluaciones</div>
              <div className="card-sub">{evals.length} evaluaciones · score promedio {evals.length ? (evals.reduce((s, e) => s + e.score, 0) / evals.length).toFixed(1) : '-'}</div>
            </div>
            <div className="right"><button className="btn ghost sm">Ver todas</button></div>
          </div>
          <table className="tbl" style={{ marginTop: 6 }}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Evaluador</th>
                <th className="right">Score</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {evals.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--fg-muted)', padding: 24 }}>Sin evaluaciones registradas</td></tr>
              )}
              {evals.map(e => (
                <tr key={e.id}>
                  <td className="num">{e.date}</td>
                  <td><span className="chip">{e.type}</span></td>
                  <td className="muted">{e.evaluator}</td>
                  <td className="right num" style={{ fontWeight: 600 }}>
                    <span className={`chip ${e.score >= 3.8 ? 'ok' : e.score >= 3.5 ? 'info' : 'warn'}`}>{e.score.toFixed(1)}</span>
                  </td>
                  <td><Icon name="chevron-right" size={14} style={{ color: 'var(--fg-dim)' }}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <div className="card-hd">
            <div className="card-title">Objetivos del mes</div>
          </div>
          <div className="col" style={{ gap: 14 }}>
            {[
              { lbl: 'Mantener Calidad ≥ 3.5', val: a.qa, goal: 3.5, max: 4 },
              { lbl: 'FRT < 5 min', val: a.frt < 5 ? 100 : 100 - (a.frt - 5) * 10, goal: 80, max: 100 },
              { lbl: 'FCR ≥ 70%', val: a.fcr, goal: 70, max: 100 },
              { lbl: 'Escalación ≤ 10%', val: a.esc <= 10 ? 100 : 100 - (a.esc - 10) * 5, goal: 80, max: 100 },
            ].map((o, i) => {
              const met = o.val >= o.goal;
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12.5 }}>{o.lbl}</span>
                    <span className={`chip ${met ? 'ok' : 'warn'}`}><span className="dot"/>{met ? 'Logrado' : 'En progreso'}</span>
                  </div>
                  <BarRow value={Math.min(o.val, o.max)} max={o.max} width="100%" color={met ? 'oklch(0.78 0.16 155)' : 'oklch(0.66 0.18 254)'} height={6}/>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, val, unit, color, goal, dir }) {
  const num = parseFloat(val);
  const met = dir === 'up' ? num >= goal : num <= goal;
  return (
    <div className="card">
      <div className="muted" style={{ fontSize: 11.5 }}>{label}</div>
      <div className="num" style={{ fontWeight: 650, fontSize: 22, letterSpacing: '-0.02em', marginTop: 6 }}>
        {val}<span style={{ fontSize: 12, color: 'var(--fg-muted)', marginLeft: 2 }}>{unit}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 11 }}>
        <span style={{ color: met ? 'oklch(0.85 0.16 155)' : 'oklch(0.88 0.16 80)' }}>
          {met ? '✓' : '!'}
        </span>
        <span className="muted">meta {dir === 'up' ? '≥' : '≤'} {goal}{unit}</span>
      </div>
      <div style={{ marginTop: 8 }}>
        <BarRow value={dir === 'up' ? num : Math.max(0, 100 - num)} max={dir === 'up' ? goal * 1.2 : 100} width="100%" color={color}/>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────

function QAList({ go }) {
  const { evaluaciones, agents } = window.PRAIA;
  const [filter, setFilter] = React.useState('all');
  const list = evaluaciones.filter(e => filter === 'all' ? true : e.status === filter);
  const avg = (evaluaciones.reduce((s, e) => s + e.score, 0) / evaluaciones.length).toFixed(1);

  return (
    <div>
      <div className="page-hd">
        <div>
          <h1>Calidad y QA</h1>
          <p>{evaluaciones.length} evaluaciones · score promedio {avg}</p>
        </div>
        <div className="right">
          <button className="btn"><Icon name="download" size={14}/> Reporte QA</button>
          <button className="btn primary" onClick={() => go('evaluacion-new')}>
            <Icon name="plus" size={14}/> Nueva evaluación
          </button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 'var(--gap)' }}>
        <StatStrip icon="shield" label="Calidad promedio" value={avg + '/4'} sub="objetivo ≥ 3.5" color="var(--accent)"/>
        <StatStrip icon="check" label="Completadas" value={evaluaciones.filter(e => e.status === 'completed').length} sub={`de ${evaluaciones.length} en total`} color="var(--ok)"/>
        <StatStrip icon="alert" label="Con observación" value={evaluaciones.filter(e => e.status === 'flagged').length} sub="requieren coaching" color="var(--warn)"/>
        <StatStrip icon="star" label="Score máximo" value={Math.max(...evaluaciones.map(e => e.score)).toFixed(1) + '/4'} sub="Zaby Hernández" color="var(--cyan)"/>
      </div>

      <div className="tabs">
        {[
          ['all', 'Todas', evaluaciones.length],
          ['completed', 'Completadas', evaluaciones.filter(e => e.status === 'completed').length],
          ['flagged', 'Con observación', evaluaciones.filter(e => e.status === 'flagged').length],
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
              <th style={{ width: 80 }}>ID</th>
              <th>Agente</th>
              <th>Evaluador</th>
              <th>Tipo</th>
              <th>Fecha</th>
              <th className="right">Score</th>
              <th>Estado</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {list.map(e => {
              const ag = agents.find(a => a.id === e.agentId) || {};
              return (
                <tr key={e.id} style={{ cursor: 'pointer' }} onClick={() => go('agente-detail', e.agentId)}>
                  <td className="num muted">{e.id.toUpperCase()}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="av" style={{ background: ag.color, width: 24, height: 24, fontSize: 10 }}>{ag.short}</div>
                      <span>{ag.name}</span>
                    </div>
                  </td>
                  <td className="muted">{e.evaluator}</td>
                  <td><span className="chip">{e.type}</span></td>
                  <td className="num">{e.date}</td>
                  <td className="right num" style={{ fontWeight: 600 }}>
                    <span className={`chip ${e.score >= 3.8 ? 'ok' : e.score >= 3.5 ? 'info' : 'warn'}`}>{e.score.toFixed(1)}</span>
                  </td>
                  <td>
                    {e.status === 'flagged'
                      ? <span className="chip warn"><span className="dot"/>Observación</span>
                      : <span className="chip ok"><span className="dot"/>Completada</span>}
                  </td>
                  <td><Icon name="chevron-right" size={14} style={{ color: 'var(--fg-dim)' }}/></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────

function Reportes() {
  const reports = [
    { name: 'Diario operativo', desc: 'KPIs operativos + volumen + alertas', period: 'Cada día 18:00', last: 'hoy 18:00', size: '2.4 MB', format: 'PDF' },
    { name: 'Semanal ejecutivo', desc: 'Comparativa semanal con resumen ejecutivo', period: 'Lunes 09:00', last: 'lun 25 may', size: '4.1 MB', format: 'PDF' },
    { name: 'Mensual QA', desc: 'Scorecards completos + ranking + coaching', period: 'Día 1 de cada mes', last: '1 may 2026', size: '8.6 MB', format: 'PDF + XLSX' },
    { name: 'Performance agentes', desc: 'Métricas por agente · todos los KPIs', period: 'Bajo demanda', last: '24 may 2026', size: '1.8 MB', format: 'XLSX' },
    { name: 'SLA Compliance', desc: 'Cumplimiento SLA por canal y prioridad', period: 'Semanal', last: 'vie 22 may', size: '1.2 MB', format: 'XLSX' },
    { name: 'Análisis CSAT', desc: 'Satisfacción interna + comentarios', period: 'Quincenal', last: '15 may 2026', size: '900 KB', format: 'PDF' },
  ];
  return (
    <div>
      <div className="page-hd">
        <div>
          <h1>Reportes</h1>
          <p>Generación automática · exportación PDF / Excel</p>
        </div>
        <div className="right">
          <button className="btn"><Icon name="settings" size={14}/> Programar</button>
          <button className="btn primary"><Icon name="plus" size={14}/> Nuevo reporte</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {reports.map((r, i) => (
          <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--r)', background: 'var(--accent-soft)', color: 'var(--accent-hi)', display: 'grid', placeItems: 'center', flex: '0 0 36px' }}>
                <Icon name="file" size={16}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.name}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{r.desc}</div>
              </div>
            </div>
            <div className="col" style={{ gap: 6, marginBottom: 14 }}>
              <KV k="Frecuencia" v={r.period}/>
              <KV k="Última generación" v={r.last}/>
              <KV k="Formato" v={r.format}/>
              <KV k="Tamaño" v={r.size}/>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
              <button className="btn sm" style={{ flex: 1 }}><Icon name="eye" size={13}/> Ver</button>
              <button className="btn sm" style={{ flex: 1 }}><Icon name="download" size={13}/> Descargar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────

function Alertas() {
  const { alerts } = window.PRAIA;
  const extras = [
    { id: 6, level: 'warning', kpi: 'CSAT', msg: 'CSAT del equipo Tarde bajó a 4.0', agent: null, time: 'hace 3h' },
    { id: 7, level: 'info', kpi: 'Coaching', msg: 'Programado: sesión coaching con A. Mejía', agent: 'Andrés Mejía', time: 'hace 5h' },
    { id: 8, level: 'critical', kpi: 'FRT', msg: 'Saturación detectada en cola WhatsApp Tarde', agent: null, time: 'ayer 19:24' },
  ];
  const all = [...alerts, ...extras];

  return (
    <div>
      <div className="page-hd">
        <div>
          <h1>Alertas e insights</h1>
          <p>{all.length} eventos · últimas 48h</p>
        </div>
        <div className="right">
          <button className="btn"><Icon name="settings" size={14}/> Reglas</button>
          <button className="btn primary"><Icon name="check" size={14}/> Marcar todo como visto</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 'var(--gap)' }}>
        <StatStrip icon="alert" label="Críticas" value={all.filter(a => a.level === 'critical').length} sub="acción inmediata" color="oklch(0.78 0.20 25)"/>
        <StatStrip icon="info" label="Advertencias" value={all.filter(a => a.level === 'warning').length} sub="monitorear" color="oklch(0.82 0.16 80)"/>
        <StatStrip icon="sparkles" label="Insights" value={all.filter(a => a.level === 'info').length} sub="oportunidades" color="oklch(0.66 0.18 254)"/>
      </div>

      <div className="card">
        <div className="col" style={{ gap: 10 }}>
          {all.map(a => {
            const lv = a.level;
            const bg = lv === 'critical' ? 'var(--bad-soft)' : lv === 'warning' ? 'var(--warn-soft)' : 'var(--accent-soft)';
            const fg = lv === 'critical' ? 'oklch(0.82 0.20 25)' : lv === 'warning' ? 'oklch(0.88 0.16 80)' : 'oklch(0.78 0.16 254)';
            return (
              <div key={a.id} className="insight">
                <div className="insight-ic" style={{ background: bg, color: fg }}>
                  <Icon name={lv === 'critical' ? 'alert' : lv === 'warning' ? 'info' : 'sparkles'} size={15}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span className={`chip ${lv === 'critical' ? 'bad' : lv === 'warning' ? 'warn' : 'info'}`} style={{ fontSize: 10 }}>{a.kpi}</span>
                    <b style={{ fontSize: 12.5 }}>{a.msg}</b>
                    <span className="muted" style={{ fontSize: 11, marginLeft: 'auto' }}>{a.time}</span>
                  </div>
                  {a.agent && <div className="dim" style={{ fontSize: 11 }}>Agente: {a.agent}</div>}
                </div>
                <button className="btn ghost sm">Resolver</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { KpisList, AgentesList, AgenteDetail, QAList, Reportes, Alertas });
