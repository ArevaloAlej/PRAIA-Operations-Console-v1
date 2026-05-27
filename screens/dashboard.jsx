// Dashboard Ejecutivo — unified (tickets + KPIs)

function Dashboard({ go }) {
  const { kpis, agents, makeSeries, makeHeatmap, alerts, tickets, apartments, issues, ago, slaProgress } = window.PRAIA;
  const featured = ['frt', 'art', 'qa', 'csat'];
  const featuredKpis = featured.map(id => kpis.find(k => k.id === id));
  const heat = React.useMemo(() => makeHeatmap(), []);
  const days30 = React.useMemo(() => Array.from({ length: 30 }, (_, i) => String(i + 1).padStart(2, '0')), []);
  const ticketsSeries = React.useMemo(() => makeSeries(99, 30, 32, 14).map(Math.round), [makeSeries]);
  const slaSeries = React.useMemo(() => makeSeries(33, 30, 94, 4), [makeSeries]);
  const qaSeries  = React.useMemo(() => makeSeries(77, 30, 89, 6), [makeSeries]);

  const trend = (id) => makeSeries(kpis.find(k => k.id === id).sparkSeed, 14, kpis.find(k => k.id === id).value, kpis.find(k => k.id === id).value * 0.12);

  const statusCount = (s) => tickets.filter(t => t.status === s).length;
  const priorityCount = (p) => tickets.filter(t => t.priority === p && t.status !== 'cerrado').length;

  const recientes = tickets.filter(t => t.status !== 'cerrado').slice(0, 6);

  const top = [...agents].sort((a, b) => b.qa - a.qa).slice(0, 5);

  // KPI top widget — replace SLA dial with CSAT
  const csatActual = kpis.find(k => k.id === 'csat').value;

  return (
    <div>
      <div className="page-hd">
        <div>
          <h1>Dashboard ejecutivo</h1>
          <p>Estado operativo — 27 mayo 2026 · 3 edificios · 15 apartamentos</p>
        </div>
        <div className="right">
          <div className="chip ok"><span className="dot"/> Sistema operativo</div>
          <button className="btn ghost">
            <Icon name="calendar" size={14}/> Últimos 30 días
            <Icon name="chevron-down" size={12}/>
          </button>
          <button className="btn">
            <Icon name="download" size={14}/> Exportar
          </button>
          <button className="btn primary">
            <Icon name="sparkles" size={14}/> Insights IA
          </button>
        </div>
      </div>

      {/* Top status strip */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 'var(--gap)' }}>
        <StatStrip icon="users" label="Agentes ATC" value={`${agents.length} · activos`} sub={agents.map(a => a.short).join(' · ') + ' · Pedro / Zaby'} color="var(--accent)"/>
        <StatStrip icon="message" label="Tickets abiertos" value={statusCount('abierto') + statusCount('proceso') + statusCount('espera')} sub={`${statusCount('abierto')} sin asignar`} color="var(--cyan)" onClick={() => go('tickets')}/>
        <StatStrip icon="star" label="CSAT mayo" value={csatActual + '/100'} sub={csatActual >= 85 ? 'Excelente · COPC ≥ 85' : 'Por debajo de target'} color="var(--ok)" onClick={() => go('csat')}/>
        <StatStrip icon="alert" label="Alertas activas" value={priorityCount('alta')} sub="prioridad alta · SLA 4h" color="var(--crit)" onClick={() => go('alertas')}/>
      </div>

      {/* Featured KPI tiles */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 'var(--gap)' }}>
        {featuredKpis.map(k => {
          const st = kpiStatus(k);
          const inv = k.goalCmp === '≤';
          const da = deltaArrow(k.delta, inv);
          const pct = k.goalCmp === '≤'
            ? Math.max(0, Math.min(100, (k.goal / k.value) * 100))
            : Math.max(0, Math.min(100, (k.value / k.goal) * 100));
          return (
            <div key={k.id} className="kpi" onClick={() => go('kpi-detail', k.id)}>
              <div className="kpi-label"><span>{k.full}</span></div>
              <div className="kpi-val">
                {fmtKPI(k)}<span className="unit">{unitKPI(k)}</span>
              </div>
              <div className="kpi-row">
                <span className={`delta ${da.cls}`}>{da.sym} {Math.abs(k.delta).toFixed(1)}{k.fmt === 'pct' ? 'pp' : '%'}</span>
                <span className="kpi-meta">meta {k.goalCmp} {k.goal}{k.fmt === 'time' && k.goal < 60 ? 's' : k.unit}</span>
              </div>
              <div className="kpi-bar"><i className={st} style={{ width: pct + '%' }}/></div>
              <div className="kpi-spark">
                <Spark data={trend(k.id)}
                  color={st === 'ok' ? 'var(--ok)' : st === 'warn' ? 'var(--warn)' : 'var(--crit)'}
                  fill width={60} height={28}/>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main row: volume chart + sla dial */}
      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', marginBottom: 'var(--gap)' }}>
        <div className="card">
          <div className="card-hd">
            <div>
              <div className="card-title">Volumen de tickets · últimos 30 días</div>
              <div className="card-sub">Promedio diario · todos los canales</div>
            </div>
            <div className="right">
              <span className="chip info">WhatsApp 42%</span>
              <span className="chip">Guesty 28%</span>
              <span className="chip">Airbnb 18%</span>
              <span className="chip">Otros 12%</span>
            </div>
          </div>
          <AreaChart data={ticketsSeries} xLabels={days30} height={220} color="var(--accent)"/>
        </div>
        <div className="card">
          <div className="card-hd">
            <div className="card-title">CSAT consolidado</div>
            <div className="right"><span className="chip ok"><span className="dot"/>{csatActual}/100</span></div>
          </div>
          <div className="ring-wrap" style={{ marginTop: 10 }}>
            <RadialDial value={csatActual} max={100} size={170} color="var(--ok)" label="meta COPC ≥ 85" sublabel="↑ 2.4pp vs mes anterior"/>
          </div>
          <div className="divider"/>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <div>
              <div className="muted" style={{ fontSize: 11 }}>Mejor OTA</div>
              <div className="num" style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>Booking</div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 11 }}>Plataformas</div>
              <div className="num" style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>6 OTAs</div>
            </div>
            <div>
              <button className="btn xs" onClick={() => go('csat')}>Detalle <Icon name="chevron-right" size={11}/></button>
            </div>
          </div>
        </div>
      </div>

      {/* Tickets activos + Top agents */}
      <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr', marginBottom: 'var(--gap)' }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-hd" style={{ padding: 'var(--pad) var(--pad) 8px', marginBottom: 0 }}>
            <div>
              <div className="card-title">Tickets activos · acción inmediata</div>
              <div className="card-sub">Top 6 por urgencia</div>
            </div>
            <div className="right">
              <button className="btn ghost sm" onClick={() => go('tickets')}>Ver todos <Icon name="chevron-right" size={12}/></button>
            </div>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 80 }}>ID</th>
                <th style={{ width: 30 }}>P</th>
                <th>Descripción</th>
                <th style={{ width: 80 }}>Apto</th>
                <th style={{ width: 110 }}>SLA</th>
              </tr>
            </thead>
            <tbody>
              {recientes.map(t => {
                const slaP = slaProgress(t);
                const c = slaP >= 100 ? 'var(--crit)' : slaP >= 80 ? 'var(--warn)' : 'var(--ok)';
                return (
                  <tr key={t.id} onClick={() => go('tickets', { id: t.id })} style={{ cursor: 'pointer' }}>
                    <td className="num" style={{ fontWeight: 600 }}>{t.id}</td>
                    <td><div className="prio" data-p={t.priority}><span/><span/><span/></div></td>
                    <td>
                      <div style={{ fontSize: 12.5 }}>{t.description}</div>
                      <div className="dim" style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)' }}>{issues.find(i => i.id === t.issue)?.label} · {ago(t.createdAt)}</div>
                    </td>
                    <td><span className="num muted" style={{ fontSize: 11.5 }}>{t.apartment}</span></td>
                    <td>
                      <div className="row" style={{ gap: 6 }}>
                        <div className="tk-sla-bar"><i style={{ width: Math.min(slaP, 100) + '%', background: c }}/></div>
                        <span className="num" style={{ fontSize: 10.5, color: c, fontWeight: 600 }}>{Math.round(slaP)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-hd">
            <div>
              <div className="card-title">Top performers · QA</div>
              <div className="card-sub">Score promedio del mes</div>
            </div>
            <div className="right">
              <button className="btn ghost sm" onClick={() => go('agentes')}>Ver <Icon name="chevron-right" size={12}/></button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {top.map((a, i) => (
              <div key={a.id} onClick={() => go('agente-detail', a.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px', cursor: 'pointer', borderRadius: 6 }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: 18, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'right' }}>{i + 1}</div>
                <div className="av" style={{ background: a.color }}>{a.short}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                  <div className="muted" style={{ fontSize: 10.5 }}>{a.role} · turno {a.shift}</div>
                </div>
                <BarRow value={a.qa} max={4} width={70} color={a.qa >= 3.8 ? 'var(--ok)' : a.qa >= 3.5 ? 'var(--accent)' : 'var(--warn)'}/>
                <div className="num" style={{ fontWeight: 600, fontSize: 13, width: 40, textAlign: 'right' }}>{a.qa.toFixed(1)}/4</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Heatmap + Alerts */}
      <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr', marginBottom: 'var(--gap)' }}>
        <div className="card">
          <div className="card-hd">
            <div>
              <div className="card-title">Mapa de calor — tickets por hora & día</div>
              <div className="card-sub">Última semana operativa</div>
            </div>
            <div className="right">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--fg-muted)' }}>
                <span>Bajo</span>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[0.15, 0.35, 0.55, 0.75, 0.95].map(v => (
                    <div key={v} style={{ width: 14, height: 10, borderRadius: 2, background: `color-mix(in oklch, var(--accent) ${v * 100}%, transparent)` }}/>
                  ))}
                </div>
                <span>Alto</span>
              </div>
            </div>
          </div>
          <Heatmap data={heat}/>
        </div>
        <div className="card">
          <div className="card-hd">
            <div>
              <div className="card-title">Alertas e insights</div>
              <div className="card-sub">{alerts.length} eventos · últimas 24h</div>
            </div>
            <div className="right">
              <button className="btn ghost sm" onClick={() => go('alertas')}>Ver todo</button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alerts.slice(0, 4).map(a => {
              const lv = a.level;
              const c = lv === 'critical' ? 'bad' : lv === 'warning' ? 'warn' : 'info';
              const bg = lv === 'critical' ? 'var(--crit-soft)' : lv === 'warning' ? 'var(--warn-soft)' : 'var(--accent-soft)';
              const fg = lv === 'critical' ? 'var(--crit)' : lv === 'warning' ? 'var(--warn)' : 'var(--accent)';
              return (
                <div key={a.id} className="insight">
                  <div className="insight-ic" style={{ background: bg, color: fg }}>
                    <Icon name={lv === 'critical' ? 'alert' : lv === 'warning' ? 'info' : 'sparkles'} size={15}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={`chip ${c}`} style={{ fontSize: 10 }}>{a.kpi}</span>
                      <span className="muted" style={{ fontSize: 10.5 }}>{a.time}</span>
                    </div>
                    <p style={{ marginTop: 4 }}>{a.msg}</p>
                    {a.agent && <p style={{ marginTop: 2, color: 'var(--fg-dim)' }}>· {a.agent}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Trend chart full width */}
      <div className="card">
        <div className="card-hd">
          <div>
            <div className="card-title">Tendencias · SLA & QA</div>
            <div className="card-sub">Comparativa 30 días</div>
          </div>
          <div className="right" style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--fg-muted)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 2, background: 'var(--accent)' }}/> SLA %
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 2, background: 'var(--cyan)' }}/> QA Score
            </span>
          </div>
        </div>
        <MultiAreaChart
          series={[
            { data: slaSeries, color: 'var(--accent)' },
            { data: qaSeries,  color: 'var(--cyan)' },
          ]}
          labels={days30}
          height={200}/>
      </div>
    </div>
  );
}

function StatStrip({ icon, label, value, sub, color, onClick }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: `color-mix(in oklch, ${color} 14%, transparent)`,
        color, display: 'grid', placeItems: 'center', flex: '0 0 38px',
      }}>
        <Icon name={icon} size={18}/>
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="muted" style={{ fontSize: 11.5 }}>{label}</div>
        <div className="serif" style={{ fontWeight: 500, fontSize: 24, letterSpacing: '-0.02em', marginTop: 1, lineHeight: 1.1 }}>{value}</div>
        <div className="dim" style={{ fontSize: 10.5, marginTop: 2 }}>{sub}</div>
      </div>
    </div>
  );
}

window.Dashboard = Dashboard;
window.StatStrip = StatStrip;
