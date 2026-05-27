// CSAT Consolidado + Correlación CSAT vs KPIs operativos

function CSAT({ go }) {
  const { csatHistory, csatScales, norm } = window.PRAIA;
  const [editing, setEditing] = React.useState(null);

  const current = csatHistory[csatHistory.length - 1];
  const previous = csatHistory[csatHistory.length - 2];
  const delta = current && previous ? (current.consolidated - previous.consolidated).toFixed(1) : '0';

  const best = csatHistory.reduce((m, r) => r.consolidated > (m?.consolidated || 0) ? r : m, null);
  const worst = csatHistory.reduce((m, r) => !m || r.consolidated < m.consolidated ? r : m, null);

  return (
    <div>
      <div className="page-hd">
        <div>
          <h1>CSAT Consolidado</h1>
          <p>Satisfacción de huéspedes · 6 plataformas OTA normalizadas a /100 · Estándar COPC: ≥ 85</p>
        </div>
        <div className="right">
          <button className="btn"><Icon name="download" size={14}/> Exportar</button>
          <button className="btn primary"><Icon name="plus" size={14}/> Registrar mes</button>
        </div>
      </div>

      {/* Header strip */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 'var(--gap)' }}>
        <div className="card">
          <div className="muted" style={{ fontSize: 11.5 }}>CSAT Actual</div>
          <div className="serif" style={{ fontWeight: 500, fontSize: 36, letterSpacing: '-0.03em', marginTop: 6 }}>
            {current.consolidated}<span style={{ fontSize: 14, color: 'var(--fg-muted)', marginLeft: 4 }}>/100</span>
          </div>
          <div className="row" style={{ marginTop: 6 }}>
            <span className={`chip ${current.status === 'excelente' ? 'ok' : current.status === 'aceptable' ? 'warn' : 'bad'}`}>
              <span className="dot"/>{current.status === 'excelente' ? 'Excelente (≥85)' : current.status === 'aceptable' ? 'Aceptable' : 'Requiere acción'}
            </span>
            <span className={`delta ${delta >= 0 ? 'up' : 'down'}`}>{delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}pp</span>
          </div>
          <div className="dim" style={{ fontSize: 11, marginTop: 4, fontFamily: 'var(--font-mono)' }}>vs mes anterior ({previous.consolidated})</div>
        </div>

        <div className="card">
          <div className="muted" style={{ fontSize: 11.5 }}>Mejor mes</div>
          <div className="serif" style={{ fontWeight: 500, fontSize: 24, marginTop: 6 }}>{best.month}</div>
          <div className="num" style={{ fontSize: 14, color: 'var(--ok)', fontWeight: 600, marginTop: 4 }}>{best.consolidated}/100</div>
          <div className="dim" style={{ fontSize: 11, marginTop: 4 }}>Score máximo alcanzado</div>
        </div>

        <div className="card">
          <div className="muted" style={{ fontSize: 11.5 }}>Mes más bajo</div>
          <div className="serif" style={{ fontWeight: 500, fontSize: 24, marginTop: 6 }}>{worst.month}</div>
          <div className="num" style={{ fontSize: 14, color: worst.consolidated >= 85 ? 'var(--ok)' : 'var(--warn)', fontWeight: 600, marginTop: 4 }}>{worst.consolidated}/100</div>
          <div className="dim" style={{ fontSize: 11, marginTop: 4 }}>Score mínimo registrado</div>
        </div>

        <div className="card">
          <div className="muted" style={{ fontSize: 11.5 }}>Promedio anual</div>
          <div className="serif" style={{ fontWeight: 500, fontSize: 24, marginTop: 6 }}>
            {(csatHistory.reduce((s, r) => s + r.consolidated, 0) / csatHistory.length).toFixed(1)}<span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>/100</span>
          </div>
          <div className="num" style={{ fontSize: 12, color: 'var(--ok)', marginTop: 4 }}>
            {csatHistory.filter(r => r.consolidated >= 85).length} de {csatHistory.length} meses ≥ 85
          </div>
        </div>
      </div>

      {/* Tendencia + Plataformas */}
      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', marginBottom: 'var(--gap)' }}>
        <div className="card">
          <div className="card-hd">
            <div>
              <div className="card-title">Tendencia CSAT consolidado</div>
              <div className="card-sub">Últimos 6 meses · target COPC ≥ 85</div>
            </div>
          </div>
          <AreaChart
            data={csatHistory.map(r => r.consolidated)}
            xLabels={csatHistory.map(r => r.month.slice(0, 3))}
            goal={85}
            height={240}
            color="var(--accent)"/>
        </div>

        <div className="card">
          <div className="card-hd">
            <div>
              <div className="card-title">Por plataforma (último mes)</div>
              <div className="card-sub">Escalas normalizadas a /100</div>
            </div>
          </div>
          <div className="col" style={{ gap: 10 }}>
            {Object.keys(csatScales).map(p => {
              const raw = current[p];
              const n = norm(p, raw);
              const lbl = { airbnb: 'Airbnb', booking: 'Booking', expedia: 'Expedia', 'hotels': 'Hotels.com', hotelbeds: 'Hotelbeds', 'trip': 'Trip.com' }[p];
              const s = csatScales[p];
              return (
                <div key={p}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 500 }}>{lbl}</span>
                    <span className="num" style={{ fontSize: 11.5, fontWeight: 600 }}>
                      {raw}<span className="muted" style={{ fontSize: 10 }}>/{s.max}</span>
                      <span style={{ marginLeft: 6, color: n >= 85 ? 'var(--ok)' : n >= 75 ? 'var(--warn)' : 'var(--crit)' }}>· {n}/100</span>
                    </span>
                  </div>
                  <BarRow value={n} max={100} width="100%" height={5}
                    color={n >= 85 ? 'var(--ok)' : n >= 75 ? 'var(--warn)' : 'var(--crit)'}/>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabla histórica */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="card-hd" style={{ padding: 'var(--pad) var(--pad) 0' }}>
          <div>
            <div className="card-title">Registro mensual por plataforma</div>
            <div className="card-sub">Cada 1° de mes · scores OTA originales + consolidado</div>
          </div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Mes</th>
              <th className="right">Airbnb<small style={{ display: 'block', fontSize: 9, fontWeight: 400 }}>(1-5)</small></th>
              <th className="right">Booking<small style={{ display: 'block', fontSize: 9, fontWeight: 400 }}>(1-10)</small></th>
              <th className="right">Expedia<small style={{ display: 'block', fontSize: 9, fontWeight: 400 }}>(1-5)</small></th>
              <th className="right">Hotels.com<small style={{ display: 'block', fontSize: 9, fontWeight: 400 }}>(1-5)</small></th>
              <th className="right">Hotelbeds<small style={{ display: 'block', fontSize: 9, fontWeight: 400 }}>(1-10)</small></th>
              <th className="right">Trip.com<small style={{ display: 'block', fontSize: 9, fontWeight: 400 }}>(1-5)</small></th>
              <th className="right">Consolidado<small style={{ display: 'block', fontSize: 9, fontWeight: 400 }}>(/100)</small></th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {[...csatHistory].reverse().map(r => (
              <tr key={r.month}>
                <td style={{ fontWeight: 600 }}>{r.month}</td>
                <td className="right num">{r.airbnb || '—'}</td>
                <td className="right num">{r.booking || '—'}</td>
                <td className="right num">{r.expedia || '—'}</td>
                <td className="right num">{r.hotels || '—'}</td>
                <td className="right num">{r.hotelbeds || '—'}</td>
                <td className="right num">{r.trip || '—'}</td>
                <td className="right num" style={{ fontWeight: 600, fontSize: 13.5,
                  color: r.consolidated >= 85 ? 'var(--ok)' : r.consolidated >= 75 ? 'var(--warn)' : 'var(--crit)' }}>
                  {r.consolidated}
                </td>
                <td>
                  <span className={`chip ${r.status === 'excelente' ? 'ok' : r.status === 'aceptable' ? 'warn' : 'bad'}`}>
                    <span className="dot"/>{r.status === 'excelente' ? 'Excelente' : r.status === 'aceptable' ? 'Aceptable' : 'Acción'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Referencia escalas */}
      <div className="card" style={{ marginTop: 'var(--gap)' }}>
        <div className="card-hd">
          <div>
            <div className="card-title">Referencia de escalas y umbrales</div>
            <div className="card-sub">COPC Standard: CSAT ≥ 85/100 = Excelente · 75-84 = Aceptable · &lt; 75 = Acción</div>
          </div>
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {Object.entries(csatScales).map(([p, s]) => {
            const lbl = { airbnb: 'Airbnb', booking: 'Booking.com', expedia: 'Expedia', 'hotels': 'Hotels.com', hotelbeds: 'Hotelbeds', 'trip': 'Trip.com' }[p];
            return (
              <div key={p} style={{ padding: 10, background: 'var(--bg-inset)', borderRadius: 'var(--r)', fontSize: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{lbl}</div>
                <div className="muted">Escala original: {s.min}–{s.max}</div>
                <div className="num" style={{ marginTop: 2 }}>Fórmula: (score / {s.max}) × 100</div>
                <div className="dim" style={{ fontSize: 11, marginTop: 4 }}>Umbral excelente: ≥ {Math.round(85 / s.factor * 10) / 10}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────

function Correlacion({ go }) {
  const { correlacion } = window.PRAIA;

  // Compute correlation: ¿FRT alto coincide con CSAT bajo?
  const rows = correlacion;
  const avgFrt = rows.reduce((s, r) => s + r.frt, 0) / rows.length;
  const avgArt = rows.reduce((s, r) => s + r.art, 0) / rows.length;
  const avgFcr = rows.reduce((s, r) => s + r.fcr, 0) / rows.length;
  const avgEsc = rows.reduce((s, r) => s + r.esc, 0) / rows.length;
  const avgCsat = rows.reduce((s, r) => s + r.csat, 0) / rows.length;

  const upMonths = rows.filter(r => r.trend === 'up').length;
  const downMonths = rows.filter(r => r.trend === 'down').length;

  const insights = [
    { type: 'ok', icon: 'check', title: 'CSAT ≥ 85 + FRT < 5', txt: 'Correlación positiva confirmada. FRT rápido = huéspedes satisfechos. Mantener prácticas actuales.' },
    { type: 'crit', icon: 'alert', title: 'CSAT baja + FRT sube', txt: 'Señal directa: lentitud en respuesta impacta CSAT. Revisa carga de trabajo y disponibilidad de agentes.' },
    { type: 'crit', icon: 'alert', title: 'CSAT baja + FCR baja', txt: 'Huéspedes necesitan múltiples contactos. Programa entrenamiento en resolución y protocolos.' },
    { type: 'warn', icon: 'info', title: 'CSAT baja + Escalación alta', txt: 'Agentes no empoderados para resolver. Revisar políticas y delegación.' },
  ];

  return (
    <div>
      <div className="page-hd">
        <div>
          <h1>Correlación CSAT ↔ KPIs</h1>
          <p>¿Cuando mejora FRT/ART/FCR sube el CSAT? Análisis mensual</p>
        </div>
        <div className="right">
          <button className="btn"><Icon name="download" size={14}/> Exportar</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 'var(--gap)' }}>
        <YearStat label="FRT prom." val={avgFrt.toFixed(1)} unit="min" target="<5" met={avgFrt < 5}/>
        <YearStat label="ART prom." val={avgArt.toFixed(1)} unit="min" target="<10" met={avgArt < 10}/>
        <YearStat label="FCR prom." val={avgFcr.toFixed(0)} unit="%" target="≥70" met={avgFcr >= 70}/>
        <YearStat label="Esc. prom." val={avgEsc.toFixed(1)} unit="%" target="≤10" met={avgEsc <= 10}/>
        <YearStat label="CSAT prom." val={avgCsat.toFixed(1)} unit="/100" target="≥85" met={avgCsat >= 85}/>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', marginBottom: 'var(--gap)' }}>
        <div className="card">
          <div className="card-hd">
            <div>
              <div className="card-title">FRT vs CSAT — relación inversa esperada</div>
              <div className="card-sub">Cuando FRT sube, CSAT debería bajar</div>
            </div>
          </div>
          <MultiAreaChart
            series={[
              { data: rows.map(r => r.csat),         color: 'var(--accent)' },
              { data: rows.map(r => 100 - r.frt * 8), color: 'var(--cyan)' }, // FRT invertido para visualización
            ]}
            labels={rows.map(r => r.month.slice(0, 3))}
            height={240}/>
          <div className="row" style={{ marginTop: 12, gap: 14, fontSize: 11, color: 'var(--fg-muted)' }}>
            <span><span style={{ display: 'inline-block', width: 10, height: 2, background: 'var(--accent)', marginRight: 4, verticalAlign: 'middle' }}/>CSAT (/100)</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 2, background: 'var(--cyan)', marginRight: 4, verticalAlign: 'middle' }}/>FRT (invertido — menor FRT = línea más alta)</span>
          </div>
        </div>

        <div className="card">
          <div className="card-hd"><div className="card-title">Tendencia anual</div></div>
          <div className="col" style={{ gap: 12 }}>
            <div className="row" style={{ justifyContent: 'space-between', padding: 10, background: 'var(--ok-soft)', borderRadius: 'var(--r)' }}>
              <span style={{ fontSize: 12.5 }}>Meses CSAT subiendo <Icon name="arrow-up" size={11} style={{ color: 'var(--ok)' }}/></span>
              <span className="num" style={{ fontWeight: 700, fontSize: 18, color: 'var(--ok)' }}>{upMonths}</span>
            </div>
            <div className="row" style={{ justifyContent: 'space-between', padding: 10, background: 'var(--crit-soft)', borderRadius: 'var(--r)' }}>
              <span style={{ fontSize: 12.5 }}>Meses CSAT bajando <Icon name="arrow-down" size={11} style={{ color: 'var(--crit)' }}/></span>
              <span className="num" style={{ fontWeight: 700, fontSize: 18, color: 'var(--crit)' }}>{downMonths}</span>
            </div>
            <div className="row" style={{ justifyContent: 'space-between', padding: 10, background: 'var(--bg-inset)', borderRadius: 'var(--r)' }}>
              <span style={{ fontSize: 12.5 }}>Meses ≥ target COPC</span>
              <span className="num" style={{ fontWeight: 700, fontSize: 18 }}>{rows.filter(r => r.csat >= 85).length}/{rows.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 'var(--gap)' }}>
        <div className="card-hd" style={{ padding: 'var(--pad) var(--pad) 0' }}>
          <div>
            <div className="card-title">Tabla mensual de correlación</div>
            <div className="card-sub">Target COPC en cada columna</div>
          </div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Mes</th>
              <th className="right">FRT<small style={{ display: 'block', fontSize: 9, fontWeight: 400 }}>(&lt;5 min)</small></th>
              <th className="right">ART<small style={{ display: 'block', fontSize: 9, fontWeight: 400 }}>(&lt;10 min)</small></th>
              <th className="right">FCR<small style={{ display: 'block', fontSize: 9, fontWeight: 400 }}>(70-85%)</small></th>
              <th className="right">Esc.<small style={{ display: 'block', fontSize: 9, fontWeight: 400 }}>(≤10%)</small></th>
              <th className="right">CSAT<small style={{ display: 'block', fontSize: 9, fontWeight: 400 }}>(≥85)</small></th>
              <th>Tendencia</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.month}>
                <td style={{ fontWeight: 600 }}>{r.month}</td>
                <td className="right num" style={{ color: r.frt < 5 ? 'var(--ok)' : 'var(--crit)' }}>{r.frt} min</td>
                <td className="right num" style={{ color: r.art < 10 ? 'var(--ok)' : 'var(--crit)' }}>{r.art} min</td>
                <td className="right num" style={{ color: r.fcr >= 70 && r.fcr <= 85 ? 'var(--ok)' : 'var(--warn)' }}>{r.fcr}%</td>
                <td className="right num" style={{ color: r.esc <= 10 ? 'var(--ok)' : 'var(--crit)' }}>{r.esc}%</td>
                <td className="right num" style={{ fontWeight: 600, color: r.csat >= 85 ? 'var(--ok)' : r.csat >= 75 ? 'var(--warn)' : 'var(--crit)' }}>{r.csat}</td>
                <td>
                  {r.trend === 'up' && <span className="chip ok"><Icon name="arrow-up" size={10}/> Subiendo</span>}
                  {r.trend === 'down' && <span className="chip bad"><Icon name="arrow-down" size={10}/> Bajando</span>}
                  {r.trend === 'flat' && <span className="chip neut">— Estable</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="card-hd">
          <div>
            <div className="card-title">Guía de interpretación</div>
            <div className="card-sub">Acciones recomendadas según patrón observado</div>
          </div>
        </div>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {insights.map((ins, i) => {
            const colorMap = { ok: ['var(--ok-soft)', 'var(--ok)'], crit: ['var(--crit-soft)', 'var(--crit)'], warn: ['var(--warn-soft)', 'var(--warn)'] };
            const [bg, fg] = colorMap[ins.type];
            return (
              <div key={i} className="insight">
                <div className="insight-ic" style={{ background: bg, color: fg }}><Icon name={ins.icon} size={14}/></div>
                <div>
                  <b>{ins.title}</b>
                  <p>{ins.txt}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function YearStat({ label, val, unit, target, met }) {
  return (
    <div className="card">
      <div className="muted" style={{ fontSize: 11.5 }}>{label}</div>
      <div className="serif" style={{ fontWeight: 500, fontSize: 26, marginTop: 6, letterSpacing: '-0.02em' }}>
        {val}<span style={{ fontSize: 12, color: 'var(--fg-muted)', marginLeft: 2 }}>{unit}</span>
      </div>
      <div className="num" style={{ fontSize: 11, marginTop: 4, color: met ? 'var(--ok)' : 'var(--warn)' }}>
        {met ? '✓' : '⚠'} Target COPC {target}
      </div>
    </div>
  );
}

Object.assign(window, { CSAT, Correlacion });
