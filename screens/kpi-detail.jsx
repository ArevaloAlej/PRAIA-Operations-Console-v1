// KPI Detail (with histórico)

function KpiDetail({ kpiId, go }) {
  const { kpis, agents, makeSeries } = window.PRAIA;
  const k = kpis.find(x => x.id === kpiId) || kpis[0];

  const [range, setRange] = React.useState('30d');
  const nDays = range === '7d' ? 7 : range === '90d' ? 90 : 30;
  const series = React.useMemo(() => {
    const s = makeSeries(k.sparkSeed * 7, nDays, k.value, k.value * 0.18);
    s[s.length - 1] = k.value;
    return s;
  }, [k.id, nDays]);
  const labels = React.useMemo(() => Array.from({ length: nDays }, (_, i) => String(i + 1).padStart(2, '0')), [nDays]);

  const st = kpiStatus(k);
  const inv = k.goalCmp === '≤';
  const da = deltaArrow(k.delta, inv);

  // Per-agent ranking based on this kpi
  const agentVal = (a) => {
    const map = { frt: a.frt, art: a.art, sla: a.resp, qa: a.qa, fcr: a.fcr, resp: a.resp, esc: a.esc, vol: a.vol, occ: 75, csat: a.csat, prod: a.fcr, eff: (a.qa / 4) * 100 };
    return map[k.id] ?? a.qa;
  };
  const ranked = [...agents].sort((a, b) => inv ? agentVal(a) - agentVal(b) : agentVal(b) - agentVal(a));
  const valMax = Math.max(...agents.map(agentVal));
  const valMin = Math.min(...agents.map(agentVal));

  return (
    <div>
      <div className="page-hd">
        <div>
          <div className="row" style={{ fontSize: 12.5, color: 'var(--fg-muted)', marginBottom: 4 }}>
            <span onClick={() => go('kpis')} style={{ cursor: 'pointer' }}>Indicadores</span>
            <Icon name="chevron-right" size={12}/>
            <span style={{ color: 'var(--fg)' }}>{k.full}</span>
          </div>
          <h1>{k.full} <span style={{ color: 'var(--fg-dim)', fontWeight: 400, fontSize: 18, marginLeft: 6 }}>· {k.label}</span></h1>
          <p>{k.desc}</p>
        </div>
        <div className="right">
          <div style={{ display: 'flex', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 2 }}>
            {['7d', '30d', '90d'].map(r => (
              <button key={r} className="btn ghost sm"
                style={{
                  background: range === r ? 'var(--bg-3)' : 'transparent',
                  color: range === r ? 'var(--fg)' : 'var(--fg-muted)',
                  height: 24, padding: '0 10px',
                }}
                onClick={() => setRange(r)}>
                {r}
              </button>
            ))}
          </div>
          <button className="btn"><Icon name="download" size={14}/> Exportar</button>
          <button className="btn primary"><Icon name="bell" size={14}/> Configurar alerta</button>
        </div>
      </div>

      {/* Top metric row */}
      <div className="grid" style={{ gridTemplateColumns: '1.2fr 1fr 1fr 1fr', marginBottom: 'var(--gap)' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <RadialDial
            value={k.fmt === 'time' ? k.value : k.value}
            max={k.goalCmp === '≤' ? k.goal * 2 : k.fmt === 'pct' ? 100 : k.goal * 1.4}
            size={132}
            color={st === 'ok' ? 'oklch(0.78 0.16 155)' : st === 'warn' ? 'oklch(0.82 0.16 80)' : 'oklch(0.78 0.20 25)'}
            label="actual"
            unit={k.unit}/>
          <div>
            <div className="muted" style={{ fontSize: 11.5 }}>vs meta {k.goalCmp} {k.goal}{k.unit}</div>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className={`chip ${st}`}>
                <span className="dot"/>
                {st === 'ok' ? 'En meta' : st === 'warn' ? 'En riesgo' : 'Fuera de meta'}
              </span>
              <span className={`delta ${da.cls}`}>{da.sym} {Math.abs(k.delta).toFixed(1)}{k.fmt === 'pct' ? 'pp' : '%'}</span>
            </div>
            <div className="divider" style={{ margin: '12px 0' }}/>
            <div className="muted" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fórmula</div>
            <div className="num" style={{ fontSize: 11.5, marginTop: 4, color: 'var(--fg-1)' }}>{k.formula}</div>
          </div>
        </div>
        <Tile label="Promedio 30d" value={(series.reduce((a, b) => a + b, 0) / series.length).toFixed(k.fmt === 'time' ? 0 : 1)} unit={k.unit}/>
        <Tile label={`Mejor ${inv ? 'mínimo' : 'máximo'}`} value={(inv ? Math.min(...series) : Math.max(...series)).toFixed(k.fmt === 'time' ? 0 : 1)} unit={k.unit}/>
        <Tile label="Variación 30d" value={(((series[series.length - 1] - series[0]) / series[0]) * 100).toFixed(1)} unit="%" inv={inv} delta/>
      </div>

      {/* Big chart */}
      <div className="card" style={{ marginBottom: 'var(--gap)' }}>
        <div className="card-hd">
          <div>
            <div className="card-title">Histórico</div>
            <div className="card-sub">{nDays} días · valor diario vs meta</div>
          </div>
          <div className="right">
            <span className="chip ok"><span className="dot"/>Meta {k.goalCmp} {k.goal}{k.unit}</span>
          </div>
        </div>
        <AreaChart
          data={series}
          xLabels={labels}
          height={280}
          color={st === 'ok' ? 'oklch(0.66 0.18 254)' : st === 'warn' ? 'oklch(0.82 0.16 80)' : 'oklch(0.78 0.20 25)'}
          goal={k.goal}
          yUnit={k.unit === '/100' ? '' : k.unit}/>
      </div>

      {/* Ranking + breakdown */}
      <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-hd" style={{ padding: 'var(--pad) var(--pad) 0', marginBottom: 8 }}>
            <div>
              <div className="card-title">Ranking de agentes</div>
              <div className="card-sub">Ordenado por {k.label} · {inv ? 'menor es mejor' : 'mayor es mejor'}</div>
            </div>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 38 }}>#</th>
                <th>Agente</th>
                <th>Equipo</th>
                <th className="right">{k.label}</th>
                <th style={{ width: 110 }}>Distribución</th>
                <th style={{ width: 90 }} className="right">Estado</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((a, i) => {
                const v = agentVal(a);
                const pct = (v - valMin) / (valMax - valMin || 1);
                const aSt = inv ? (v <= k.goal ? 'ok' : v <= k.goal * 1.15 ? 'warn' : 'bad')
                                : (v >= k.goal ? 'ok' : v >= k.goal * 0.9 ? 'warn' : 'bad');
                const color = aSt === 'ok' ? 'oklch(0.78 0.16 155)' : aSt === 'warn' ? 'oklch(0.82 0.16 80)' : 'oklch(0.78 0.20 25)';
                return (
                  <tr key={a.id} onClick={() => go('agente-detail', a.id)} style={{ cursor: 'pointer' }}>
                    <td className="num muted">{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="av" style={{ background: a.color, width: 24, height: 24, fontSize: 10 }}>{a.short}</div>
                        <span>{a.name}</span>
                      </div>
                    </td>
                    <td className="muted">{a.role} · {a.shift}</td>
                    <td className="right num" style={{ fontWeight: 600 }}>{typeof v === 'number' ? v.toFixed(k.fmt === 'time' ? 0 : 1) : v}{k.unit}</td>
                    <td><BarRow value={inv ? 1 - pct : pct} max={1} color={color} width={100}/></td>
                    <td className="right"><span className={`chip ${aSt}`}><span className="dot"/>{aSt === 'ok' ? 'meta' : aSt === 'warn' ? 'riesgo' : 'crítico'}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="col" style={{ gap: 'var(--gap)' }}>
          <div className="card">
            <div className="card-hd">
              <div className="card-title">Insights</div>
              <span className="chip info" style={{ marginLeft: 'auto' }}><Icon name="sparkles" size={10}/> IA</span>
            </div>
            <div className="col">
              <div className="insight">
                <div className="insight-ic" style={{ background: 'var(--accent-soft)', color: 'oklch(0.78 0.16 254)' }}>
                  <Icon name="trending-up" size={15}/>
                </div>
                <div>
                  <b>Tendencia positiva sostenida</b>
                  <p>{k.label} mejoró {Math.abs(k.delta).toFixed(1)}{k.fmt === 'pct' ? 'pp' : '%'} en los últimos {nDays} días, manteniéndose por {k.goalCmp === '≤' ? 'debajo' : 'encima'} de la meta operativa.</p>
                </div>
              </div>
              <div className="insight">
                <div className="insight-ic" style={{ background: 'var(--warn-soft)', color: 'oklch(0.88 0.16 80)' }}>
                  <Icon name="clock" size={15}/>
                </div>
                <div>
                  <b>Ventana crítica detectada</b>
                  <p>Picos de {k.label} entre 17–19h coinciden con saturación de cola. Considerar refuerzo en ATC Tarde.</p>
                </div>
              </div>
              <div className="insight">
                <div className="insight-ic" style={{ background: 'var(--ok-soft)', color: 'oklch(0.85 0.16 155)' }}>
                  <Icon name="star" size={15}/>
                </div>
                <div>
                  <b>Referente del equipo</b>
                  <p>{ranked[0].name} mantiene los mejores resultados del trimestre y puede liderar coaching cruzado.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-hd">
              <div className="card-title">Configuración del indicador</div>
            </div>
            <div className="col" style={{ gap: 12 }}>
              <KV k="Categoría" v="Operativo · Tiempo real"/>
              <KV k="Fuente" v="PRAIA Volumen 1 · ATC API"/>
              <KV k="Refresco" v="Cada 60 segundos"/>
              <KV k="Meta operativa" v={`${k.goalCmp} ${k.goal}${k.unit}`}/>
              <KV k="Umbral riesgo" v={k.goalCmp === '≤' ? `${(k.goal * 1.15).toFixed(0)}${k.unit}` : `${(k.goal * 0.9).toFixed(0)}${k.unit}`}/>
              <KV k="Responsable" v="Equipo Calidad ATC"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, unit, delta, inv }) {
  const num = parseFloat(value);
  const up = (delta && (inv ? num < 0 : num > 0));
  return (
    <div className="card">
      <div className="muted" style={{ fontSize: 11.5 }}>{label}</div>
      <div className="num" style={{ fontWeight: 650, fontSize: 24, letterSpacing: '-0.02em', marginTop: 8 }}>
        {delta && (num > 0 ? '+' : '')}{value}<span style={{ fontSize: 12, color: 'var(--fg-muted)', marginLeft: 2 }}>{unit}</span>
      </div>
      {delta && (
        <div style={{ marginTop: 4, fontSize: 11, color: up ? 'oklch(0.85 0.16 155)' : num === 0 ? 'var(--fg-muted)' : 'oklch(0.82 0.20 25)' }}>
          {up ? 'Mejora' : num === 0 ? 'Sin cambio' : 'Empeora'} sobre periodo previo
        </div>
      )}
    </div>
  );
}

function KV({ k, v }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, fontSize: 12.5 }}>
      <span className="muted">{k}</span>
      <span className="num" style={{ color: 'var(--fg)', textAlign: 'right' }}>{v}</span>
    </div>
  );
}

window.KpiDetail = KpiDetail;
window.KV = KV;
