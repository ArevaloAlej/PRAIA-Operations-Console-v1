// Evaluación QA — basada en plantilla REAL Pedro / Zaby (escala 1-4)

function EvaluacionForm({ go, onSubmit }) {
  const { agents, rubric, calidadEscala } = window.PRAIA;
  const [step, setStep] = React.useState(1);
  const [data, setData] = React.useState({
    agentId: agents[0].id,
    evaluator: 'Ana Carrillo',
    date: '2026-05-27',
    platform: 'guesty',
    booking: '',
    conversationDate: '2026-05-26',
    estadoFinal: 'Resuelto',
    frt: '',
    art: '',
    fcr: 'sí',
    escalado: 'no',
    motivoEsc: '',
    escA: '',
    apropiada: 'sí',
    relevancia: 3, completitud: 3, cortesia: 3, precision: 3, claridad: 3,
    fortalezas: '',
    mejoras: '',
    acciones: '',
  });
  const upd = (k, v) => setData(d => ({ ...d, [k]: v }));

  const agent = agents.find(a => a.id === data.agentId);
  const promedio_calidad = (data.relevancia + data.completitud + data.cortesia + data.precision + data.claridad) / 5;
  const cumpleFRT = parseFloat(data.frt) > 0 && parseFloat(data.frt) < 5;
  const cumpleART = parseFloat(data.art) > 0 && parseFloat(data.art) < 10;
  const cumpleCalidad = promedio_calidad >= 3.5;

  const resultado = (() => {
    const cnt = [cumpleFRT, cumpleART, cumpleCalidad, data.fcr === 'sí', data.escalado === 'no' || data.apropiada === 'sí'].filter(Boolean).length;
    if (promedio_calidad >= 3.8 && cumpleFRT && cumpleART) return 'Excelente';
    if (cnt >= 4 && promedio_calidad >= 3.5) return 'Bueno';
    if (cnt >= 3) return 'Aceptable';
    return 'Deficiente';
  })();

  const submit = () => onSubmit && onSubmit({ agent: agent.name, score: promedio_calidad.toFixed(1) });

  return (
    <div>
      <div className="page-hd">
        <div>
          <div className="row" style={{ fontSize: 12.5, color: 'var(--fg-muted)', marginBottom: 4 }}>
            <span onClick={() => go('qa')} style={{ cursor: 'pointer' }}>Calidad / QA</span>
            <Icon name="chevron-right" size={12}/>
            <span style={{ color: 'var(--fg)' }}>Nueva evaluación</span>
          </div>
          <h1>Evaluación de conversación</h1>
          <p>Muestreo aleatorio · Estándares COPC · Plantilla Pedro / Zaby</p>
        </div>
        <div className="right">
          <button className="btn ghost" onClick={() => go('qa')}>Cancelar</button>
          <button className="btn">Guardar borrador</button>
          <button className="btn primary" onClick={submit}>
            <Icon name="check" size={14}/> Publicar evaluación
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 'var(--gap)' }}>
        <div className="col" style={{ gap: 'var(--gap)' }}>
          {/* Steps */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {[
                { n: 1, label: '1. Información general' },
                { n: 2, label: '2. Tiempos · FCR · Escalación' },
                { n: 3, label: '3. Calidad (1-4)' },
                { n: 4, label: '4. Resumen' },
              ].map((s, i, arr) => (
                <React.Fragment key={s.n}>
                  <div onClick={() => setStep(s.n)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      display: 'grid', placeItems: 'center',
                      fontSize: 11, fontWeight: 600,
                      background: step >= s.n ? 'var(--accent)' : 'var(--bg-3)',
                      color: step >= s.n ? '#fff' : 'var(--fg-muted)',
                      fontFamily: 'var(--font-mono)',
                      flex: '0 0 22px',
                    }}>
                      {step > s.n ? <Icon name="check" size={11}/> : s.n}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, color: step >= s.n ? 'var(--fg)' : 'var(--fg-muted)' }}>{s.label}</span>
                  </div>
                  {i < arr.length - 1 && <div style={{ flex: 0, height: 1, background: step > s.n ? 'var(--accent)' : 'var(--border)', minWidth: 20 }}/>}
                </React.Fragment>
              ))}
            </div>
          </div>

          {step === 1 && (
            <div className="card">
              <div className="card-hd">
                <div className="card-title">1. Información general</div>
              </div>
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="field">
                  <label>Agente evaluado</label>
                  <select className="select" value={data.agentId} onChange={(e) => upd('agentId', e.target.value)}>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.name} — {a.role}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Evaluador</label>
                  <select className="select" value={data.evaluator} onChange={(e) => upd('evaluator', e.target.value)}>
                    <option>Ana Carrillo</option>
                    <option>Mauricio</option>
                    <option>Alejandro</option>
                  </select>
                </div>
                <div className="field">
                  <label>Fecha de auditoría</label>
                  <input className="input" type="date" value={data.date} onChange={(e) => upd('date', e.target.value)}/>
                </div>
                <div className="field">
                  <label>Plataforma</label>
                  <select className="select" value={data.platform} onChange={(e) => upd('platform', e.target.value)}>
                    <option value="guesty">Guesty</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="airbnb">Airbnb</option>
                    <option value="booking">Booking</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label>Booking ID / Huésped</label>
                  <input className="input" placeholder="ej. BK-4421 · Sarah Johnson" value={data.booking} onChange={(e) => upd('booking', e.target.value)}/>
                </div>
                <div className="field">
                  <label>Fecha de conversación</label>
                  <input className="input" type="date" value={data.conversationDate} onChange={(e) => upd('conversationDate', e.target.value)}/>
                </div>
                <div className="field">
                  <label>Estado final del caso</label>
                  <select className="select" value={data.estadoFinal} onChange={(e) => upd('estadoFinal', e.target.value)}>
                    <option>Resuelto</option>
                    <option>Escalado</option>
                    <option>Pendiente</option>
                  </select>
                </div>
              </div>
              <div className="divider"/>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn primary" onClick={() => setStep(2)}>
                  Continuar <Icon name="chevron-right" size={14}/>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="card">
              <div className="card-hd">
                <div className="card-title">2. Tiempos · FCR · Escalación</div>
              </div>
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div className="field">
                  <label>FRT · Tiempo Primera Respuesta (min)</label>
                  <input className="input" type="number" step="0.1" value={data.frt} onChange={(e) => upd('frt', e.target.value)} placeholder="ej. 3.5"/>
                  <div className="dim" style={{ fontSize: 11, marginTop: 2 }}>
                    {data.frt ? (
                      <span style={{ color: cumpleFRT ? 'var(--ok)' : 'var(--crit)' }}>
                        {cumpleFRT ? '✓ Cumple' : '✗ No cumple'} · Target COPC &lt; 5 min
                      </span>
                    ) : 'Target COPC < 5 min'}
                  </div>
                </div>
                <div className="field">
                  <label>ART · Tiempo Promedio Respuesta (min)</label>
                  <input className="input" type="number" step="0.1" value={data.art} onChange={(e) => upd('art', e.target.value)} placeholder="ej. 7.2"/>
                  <div className="dim" style={{ fontSize: 11, marginTop: 2 }}>
                    {data.art ? (
                      <span style={{ color: cumpleART ? 'var(--ok)' : 'var(--crit)' }}>
                        {cumpleART ? '✓ Cumple' : '✗ No cumple'} · Target COPC &lt; 10 min
                      </span>
                    ) : 'Target COPC < 10 min'}
                  </div>
                </div>
              </div>

              <div className="divider"/>
              <div className="card-hd"><div className="card-title">FCR · Resolución en Primer Contacto</div></div>
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <YesNo label="¿Resuelto sin escalar?" value={data.fcr} onChange={(v) => upd('fcr', v)}/>
                <YesNo label="¿Huésped satisfecho?" value={'sí'} onChange={() => {}} />
                <YesNo label="¿Caso reabrió 24h?" value={'no'} onChange={() => {}} />
              </div>

              <div className="divider"/>
              <div className="card-hd"><div className="card-title">Escalación</div></div>
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <YesNo label="¿Se escaló este caso?" value={data.escalado} onChange={(v) => upd('escalado', v)}/>
                {data.escalado === 'sí' && (
                  <>
                    <div className="field">
                      <label>Motivo</label>
                      <input className="input" value={data.motivoEsc} onChange={(e) => upd('motivoEsc', e.target.value)} placeholder="Solo si aplicó"/>
                    </div>
                    <div className="field">
                      <label>A quién</label>
                      <select className="select" value={data.escA} onChange={(e) => upd('escA', e.target.value)}>
                        <option value="">—</option>
                        <option>Mauricio</option>
                        <option>Alejandro</option>
                        <option>Otro</option>
                      </select>
                    </div>
                    <YesNo label="¿Escalación apropiada?" value={data.apropiada} onChange={(v) => upd('apropiada', v)}/>
                  </>
                )}
              </div>

              <div className="divider"/>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn" onClick={() => setStep(1)}><Icon name="chevron-left" size={14}/> Volver</button>
                <button className="btn primary" onClick={() => setStep(3)}>Continuar <Icon name="chevron-right" size={14}/></button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="card">
              <div className="card-hd">
                <div>
                  <div className="card-title">3. Calidad (1-4)</div>
                  <div className="card-sub">
                    1=Deficiente · 2=Aceptable · 3=Bueno · 4=Excelente · Target ≥ 3.5
                  </div>
                </div>
                <div className="right">
                  <span className={`chip ${cumpleCalidad ? 'ok' : 'warn'}`}>
                    <span className="dot"/>
                    Promedio: <b style={{ marginLeft: 4 }}>{promedio_calidad.toFixed(2)}/4</b>
                  </span>
                </div>
              </div>

              <div className="col" style={{ gap: 18 }}>
                {rubric.map(c => (
                  <CalidadRow key={c.id}
                    label={c.label} desc={c.desc}
                    value={data[c.id]}
                    onChange={(v) => upd(c.id, v)}
                    escala={calidadEscala}/>
                ))}
              </div>

              <div className="divider"/>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn" onClick={() => setStep(2)}><Icon name="chevron-left" size={14}/> Volver</button>
                <button className="btn primary" onClick={() => setStep(4)}>Continuar <Icon name="chevron-right" size={14}/></button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="card">
              <div className="card-hd"><div className="card-title">4. Resumen final</div></div>
              <div className="col" style={{ gap: 14 }}>
                <div className="field">
                  <label>Fortalezas</label>
                  <textarea className="textarea" rows="3" value={data.fortalezas} onChange={(e) => upd('fortalezas', e.target.value)}/>
                </div>
                <div className="field">
                  <label>Áreas de mejora</label>
                  <textarea className="textarea" rows="3" value={data.mejoras} onChange={(e) => upd('mejoras', e.target.value)}/>
                </div>
                <div className="field">
                  <label>Acciones recomendadas</label>
                  <textarea className="textarea" rows="3" value={data.acciones} onChange={(e) => upd('acciones', e.target.value)}/>
                </div>
              </div>
              <div className="divider"/>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn" onClick={() => setStep(3)}><Icon name="chevron-left" size={14}/> Volver</button>
                <button className="btn primary" onClick={submit}><Icon name="check" size={14}/> Publicar evaluación</button>
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="col" style={{ gap: 'var(--gap)', position: 'sticky', top: 0, alignSelf: 'flex-start' }}>
          <div className="card">
            <div className="card-hd">
              <div className="card-title">Vista previa</div>
              <span className="chip info" style={{ marginLeft: 'auto' }}>
                {resultado}
              </span>
            </div>
            <div className="row" style={{ gap: 12, marginBottom: 14 }}>
              <div className="av lg" style={{ background: agent.color }}>{agent.short}</div>
              <div>
                <div style={{ fontWeight: 600 }}>{agent.name}</div>
                <div className="muted" style={{ fontSize: 12 }}>{agent.role} · {data.platform}</div>
                <div className="dim" style={{ fontSize: 11, marginTop: 2 }}>{data.date}</div>
              </div>
            </div>

            <div className="ring-wrap" style={{ marginBottom: 14 }}>
              <RadialDial
                value={promedio_calidad}
                max={4}
                size={150}
                color={cumpleCalidad ? 'var(--ok)' : promedio_calidad >= 3 ? 'var(--warn)' : 'var(--crit)'}
                label="calidad promedio"
                sublabel="target ≥ 3.5/4"
                unit="/4"/>
            </div>

            <div className="col" style={{ gap: 8 }}>
              {rubric.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, fontSize: 11.5 }}>{c.label}</div>
                  <BarRow value={data[c.id]} max={4} width={70}
                    color={data[c.id] >= 4 ? 'var(--ok)' : data[c.id] >= 3 ? 'var(--accent)' : data[c.id] >= 2 ? 'var(--warn)' : 'var(--crit)'}/>
                  <div className="num" style={{ fontSize: 11.5, width: 22, textAlign: 'right', fontWeight: 600 }}>{data[c.id]}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-hd"><div className="card-title">Indicadores</div></div>
            <div className="col" style={{ gap: 10, fontSize: 12 }}>
              <KV k="FRT" v={data.frt ? `${data.frt} min · ${cumpleFRT ? '✓' : '✗'}` : '—'}/>
              <KV k="ART" v={data.art ? `${data.art} min · ${cumpleART ? '✓' : '✗'}` : '—'}/>
              <KV k="FCR" v={data.fcr === 'sí' ? '✓ Resuelto 1ra' : '✗ Reabrió'}/>
              <KV k="Escalación" v={data.escalado === 'sí' ? `Sí · ${data.escA || '—'}` : 'No'}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CalidadRow({ label, desc, value, onChange, escala }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <div>
          <span style={{ fontWeight: 600, fontSize: 13.5 }}>{label}</span>
          <span className="muted" style={{ fontSize: 11.5, marginLeft: 8 }}>· {desc}</span>
        </div>
        <span className="num" style={{ fontSize: 12, color: escala.find(e => e.v === value)?.color, fontWeight: 600 }}>
          {value} — {escala.find(e => e.v === value)?.label}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {escala.map(e => (
          <button key={e.v} onClick={() => onChange(e.v)}
            style={{
              flex: 1,
              padding: '10px 6px',
              borderRadius: 'var(--r)',
              border: value === e.v ? '2px solid ' + e.color : '1px solid var(--border)',
              background: value === e.v ? `color-mix(in oklch, ${e.color} 12%, transparent)` : 'var(--bg-1)',
              color: value === e.v ? e.color : 'var(--fg-1)',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: value === e.v ? 600 : 500,
              textAlign: 'center',
            }}>
            <div className="num" style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{e.v}</div>
            <div style={{ fontSize: 10.5 }}>{e.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function YesNo({ label, value, onChange }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div style={{ display: 'flex', gap: 0, background: 'var(--bg-inset)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 2 }}>
        {['sí', 'no'].map(o => (
          <button key={o} onClick={() => onChange(o)}
            style={{
              flex: 1, height: 28, border: 0, cursor: 'pointer', borderRadius: 5,
              background: value === o ? 'var(--bg-1)' : 'transparent',
              color: value === o ? 'var(--fg)' : 'var(--fg-muted)',
              fontWeight: value === o ? 600 : 500,
              fontSize: 12, textTransform: 'uppercase',
              boxShadow: value === o ? 'var(--sh-1)' : 'none',
            }}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

window.EvaluacionForm = EvaluacionForm;
