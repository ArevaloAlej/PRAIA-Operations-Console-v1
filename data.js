// PRAIA Hotel ATC — REAL data structure
// Basado en archivos fuente: Control_KPI_ATC_PRAIA_V1, Evaluaciones_Pedro, Evaluaciones_Zaby
// Estándares COPC — Pedro y Zaby como agentes ATC

window.PRAIA = (function () {
  const colors = [
    'oklch(0.62 0.18 254)', // Pedro
    'oklch(0.62 0.16 320)', // Zaby
    'oklch(0.62 0.14 100)', // Mauricio
    'oklch(0.62 0.18 25)',  // Alejandro
    'oklch(0.55 0.06 270)', // Ana
  ];

  // ============ AGENTS (REAL) ============
  // Solo Pedro y Zaby son agentes ATC. Mauricio y Alejandro reciben escalaciones.
  // Ana es supervisora/admin.
  const agents = [
    {
      id: 'pedro',
      email: 'pedro@praiahotel.com',
      name: 'Pedro Castillo',
      short: 'PE',
      role: 'Agente ATC',
      shift: 'Mañana',
      color: colors[0],
      // KPIs promedio (placeholder real-shape; valores reales se llenan al cargar evaluaciones)
      qa: 3.6,   // /4
      frt: 4.2,  // min
      art: 8.1,  // min
      fcr: 78,   // %
      resp: 96,  // %
      esc: 7.5,  // %
      vol: 42,   // msgs/turno
      csat: 87,  // /100 (heredado del global CSAT)
      eval_count: 12,
      active: true,
    },
    {
      id: 'zaby',
      email: 'zaby@praiahotel.com',
      name: 'Zaby Hernández',
      short: 'ZA',
      role: 'Agente ATC',
      shift: 'Tarde',
      color: colors[1],
      qa: 3.8,
      frt: 3.4,
      art: 6.9,
      fcr: 82,
      resp: 97,
      esc: 5.2,
      vol: 45,
      csat: 87,
      eval_count: 10,
      active: true,
    },
  ];

  // Supervisores que reciben escalaciones (no son agentes ATC)
  const escalation_targets = [
    { id: 'mauricio',  name: 'Mauricio',  role: 'Supervisor' },
    { id: 'alejandro', name: 'Alejandro', role: 'Supervisor' },
  ];

  // ============ USERS (login) ============
  const users = [
    { id: 'admin', email: 'ana.carrillo@praiahotel.com', name: 'Ana Carrillo', role: 'Supervisora', access_level: 9 },
    { id: 'pedro', email: 'pedro@praiahotel.com',         name: 'Pedro Castillo', role: 'Agente ATC', access_level: 1 },
    { id: 'zaby',  email: 'zaby@praiahotel.com',          name: 'Zaby Hernández',  role: 'Agente ATC', access_level: 1 },
  ];

  // ============ APARTMENTS (3 edificios × 5 unidades) ============
  const apartments = [];
  const buildings = ['7834', '7830', '7820'];
  buildings.forEach(b => {
    for (let i = 1; i <= 5; i++) {
      apartments.push({
        id: `${b}-${i}`,
        building: b,
        beds: i % 3 === 0 ? 3 : 2,
        baths: i % 2 === 0 ? 2 : 1,
        capacity: i % 3 === 0 ? 6 : 4,
        address: `NW ${b}, Unit ${i}`,
      });
    }
  });

  // ============ ISSUES & PLATFORMS ============
  const issues = [
    { id: 'limpieza',  label: 'Limpieza',         icon: 'sparkles' },
    { id: 'mold',      label: 'Moho / humedad',   icon: 'alert' },
    { id: 'personas',  label: 'Exceso personas',  icon: 'users' },
    { id: 'plomeria',  label: 'Plomería',         icon: 'settings' },
    { id: 'ac',        label: 'Aire / clima',     icon: 'zap' },
    { id: 'wifi',      label: 'WiFi',             icon: 'message' },
    { id: 'ruido',     label: 'Ruido',            icon: 'bell' },
    { id: 'llaves',    label: 'Llaves / acceso',  icon: 'lock' },
    { id: 'tv',        label: 'TV',               icon: 'eye' },
    { id: 'cocina',    label: 'Cocina',           icon: 'star' },
    { id: 'checkin',   label: 'Check-in',         icon: 'arrow-up' },
    { id: 'checkout',  label: 'Check-out',        icon: 'arrow-down' },
    { id: 'inventario',label: 'Inventario',       icon: 'file' },
  ];

  // Plataformas reales de ATC
  const platforms = ['guesty', 'whatsapp', 'airbnb', 'booking', 'email', 'phone'];

  // ============ TICKETS (representativos) ============
  function rng(seed) { let s = seed | 0; return () => { s = (s * 1664525 + 1013904223) | 0; return ((s >>> 0) % 1000) / 1000; }; }
  function pick(r, arr) { return arr[Math.floor(r() * arr.length)]; }

  const guestNames = [
    'Sarah Johnson', 'Carlos Rivera', 'Emma Williams', 'Liam Schmidt', 'Olivia Brown',
    'Noah Davis', 'Ava García', 'Lucas Martin', 'Mia Thompson', 'Ethan Wilson',
    'Sophia López', 'Mason Anderson', 'Hugo Bernard', 'Inés Castaño', 'Tom Becker',
  ];
  const SLA_HOURS = { alta: 4, media: 12, baja: 24 };
  const now = new Date('2026-05-27T14:30:00');
  function randomDateBefore(r, maxHours) {
    return new Date(now.getTime() - Math.floor(r() * maxHours * 3600 * 1000));
  }
  const tickets = [];
  const r = rng(7);
  for (let i = 1; i <= 42; i++) {
    const status = i <= 6 ? 'abierto' : i <= 14 ? 'proceso' : i <= 20 ? 'espera' : 'cerrado';
    const priority = pick(r, ['alta', 'media', 'baja']);
    const issue = pick(r, issues).id;
    const platform = pick(r, ['guesty', 'whatsapp']);  // ATC primarios
    const apt = pick(r, apartments);
    const agent = status === 'abierto' && r() < 0.5 ? null : pick(r, agents);
    const ageHours = status === 'cerrado' ? 24 + r() * 96 : (status === 'abierto' ? r() * 4 : r() * 14);
    const createdAt = randomDateBefore(r, ageHours);
    const updatedAt = status === 'cerrado'
      ? new Date(createdAt.getTime() + (1 + r() * SLA_HOURS[priority]) * 3600 * 1000)
      : new Date(createdAt.getTime() + r() * ageHours * 3600 * 1000);
    const slaDeadline = new Date(createdAt.getTime() + SLA_HOURS[priority] * 3600 * 1000);
    const titles = {
      limpieza:   ['Limpieza pendiente tras check-out', 'Toallas no repuestas', 'Habitación sucia al ingresar'],
      mold:       ['Mancha de humedad en techo baño', 'Olor a moho en armario'],
      personas:   ['Reportan 6 personas en unidad para 4', 'Huéspedes adicionales detectados'],
      plomeria:   ['Inodoro tapado', 'Grifo lavamanos gotea', 'Sin agua caliente'],
      ac:         ['A/C no enfría', 'Aire acondicionado hace ruido', 'Termostato no responde'],
      wifi:       ['WiFi desconectado en sala', 'Internet lento — 3Mbps'],
      ruido:      ['Vecinos ruidosos — música alta', 'Obras en edificio adyacente'],
      llaves:     ['Llave digital no funciona', 'Cliente no puede ingresar al edificio'],
      tv:         ['TV sin señal', 'Control remoto perdido'],
      cocina:     ['Estufa no enciende', 'Faltan utensilios'],
      checkin:    ['Check-in tardío solicitado', 'Cliente llegó antes — coordinar early check-in'],
      checkout:   ['Late check-out solicitado', 'Cliente no liberó unidad a tiempo'],
      inventario: ['Falta inventario — sábanas', 'Toallas y amenities solicitados'],
    };
    tickets.push({
      id: 'TK-' + String(2000 + i).padStart(4, '0'),
      status, priority, platform, issue,
      apartment: apt.id,
      guest: pick(r, guestNames),
      agent: agent ? agent.id : null,
      description: pick(r, titles[issue] || ['Solicitud de huésped']),
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      closedAt: status === 'cerrado' ? updatedAt.toISOString() : null,
      slaDeadline: slaDeadline.toISOString(),
    });
  }
  tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // ============ KPI DEFINITIONS — TARGETS REALES COPC ============
  const kpis = [
    { id: 'frt',  label: 'FRT',  full: 'Tiempo de Primera Respuesta',
      value: 3.8, unit: 'min', goal: 5, goalCmp: '≤', delta: -0.4, sparkSeed: 12, fmt: 'num',
      desc: 'Tiempo desde que llega el mensaje del huésped hasta la primera respuesta del agente. Crítico para satisfacción.',
      formula: 'Σ(t_primera_respuesta − t_apertura) / N muestras',
      source: 'Muestreo manual · Guesty + WhatsApp',
      cat: 'Operativo', copc: '< 5 min' },

    { id: 'art',  label: 'ART',  full: 'Tiempo Promedio de Respuesta',
      value: 7.5, unit: 'min', goal: 10, goalCmp: '≤', delta: -1.2, sparkSeed: 8, fmt: 'num',
      desc: 'Promedio de tiempo entre respuestas del agente durante la conversación.',
      formula: 'Σ Δt(mensajes_agente) / N intervalos',
      source: 'Guesty (timestamps) + Muestreo WhatsApp',
      cat: 'Operativo', copc: '< 10 min' },

    { id: 'fcr',  label: 'FCR',  full: 'Resolución en Primer Contacto',
      value: 80, unit: '%', goal: 75, goalCmp: '≥', delta: 4.2, sparkSeed: 9, fmt: 'pct',
      desc: 'Porcentaje de casos resueltos sin escalación ni reapertura en 24h.',
      formula: '(N_resueltos_1ra / N_casos_auditados) × 100',
      source: 'Auditoría manual semanal · 5-10 casos cerrados por agente',
      cat: 'Calidad', copc: '70-85%' },

    { id: 'resp', label: 'Resp.', full: 'Tasa de Respuesta',
      value: 96.5, unit: '%', goal: 95, goalCmp: '≥', delta: 0.6, sparkSeed: 4, fmt: 'pct',
      desc: 'Porcentaje de mensajes de huéspedes que reciben respuesta.',
      formula: '(Mensajes_respondidos / Mensajes_recibidos) × 100',
      source: 'Reporte Guesty + Muestreo WhatsApp',
      cat: 'Operativo', copc: '≥ 95%' },

    { id: 'esc',  label: 'Esc.', full: 'Tasa de Escalación',
      value: 6.4, unit: '%', goal: 10, goalCmp: '≤', delta: -1.4, sparkSeed: 11, fmt: 'pct',
      desc: 'Porcentaje de casos escalados a Supervisor (Mauricio / Alejandro).',
      formula: '(Casos_escalados / Casos_totales) × 100',
      source: 'Playa Desktop (reaperturas) + Escalaciones manuales',
      cat: 'Operativo', copc: '≤ 10%' },

    { id: 'vol',  label: 'Vol.', full: 'Volumen de Mensajes / Agente',
      value: 43, unit: '/turno', goal: 40, goalCmp: '≈', delta: 2, sparkSeed: 5, fmt: 'num',
      desc: 'Promedio de mensajes manejados por agente por turno (8h).',
      formula: 'N_mensajes / N_turnos',
      source: 'Reporte mensual Guesty + WhatsApp',
      cat: 'Productividad', copc: '30-50 / turno' },

    { id: 'qa',   label: 'Calidad', full: 'Calidad Promedio /4',
      value: 3.7, unit: '/4', goal: 3.5, goalCmp: '≥', delta: 0.2, sparkSeed: 3, fmt: 'num',
      desc: 'Promedio de 5 criterios: Relevancia, Completitud, Cortesía, Precisión, Claridad. Escala 1-4.',
      formula: '(Relev + Compl + Cort + Prec + Clar) / 5',
      source: 'Evaluaciones Pedro / Zaby · muestreo aleatorio',
      cat: 'Calidad', copc: '≥ 3.5' },

    { id: 'csat', label: 'CSAT', full: 'CSAT Consolidado',
      value: 87, unit: '/100', goal: 85, goalCmp: '≥', delta: 2.4, sparkSeed: 2, fmt: 'num',
      desc: 'CSAT consolidado normalizado de 6 plataformas OTA (Airbnb, Booking, Expedia, Hotels, Hotelbeds, Trip).',
      formula: 'Promedio(scores_normalizados_OTA) × 100',
      source: 'Plataformas OTA · registro mensual',
      cat: 'Satisfacción', copc: '≥ 85/100' },
  ];

  // ============ CSAT CONSOLIDADO ============
  // Histórico de OTAs por mes
  const csatScales = {
    airbnb:    { min: 1, max: 5,  factor: 20 },
    booking:   { min: 1, max: 10, factor: 10 },
    expedia:   { min: 1, max: 5,  factor: 20 },
    'hotels':  { min: 1, max: 5,  factor: 20 },
    hotelbeds: { min: 1, max: 10, factor: 10 },
    'trip':    { min: 1, max: 5,  factor: 20 },
  };
  function norm(platform, score) {
    if (score == null) return null;
    const s = csatScales[platform];
    return Math.round(score * s.factor * 10) / 10;
  }
  // Datos reales del CSAT por mes (ejemplo basado en patrones reales del archivo)
  const csatHistory = [
    { month: 'Dic 2025', airbnb: 4.4, booking: 8.6, expedia: 4.3, hotels: 4.2, hotelbeds: 8.5, trip: 4.3 },
    { month: 'Ene 2026', airbnb: 4.5, booking: 8.7, expedia: 4.4, hotels: 4.3, hotelbeds: 8.7, trip: 4.4 },
    { month: 'Feb 2026', airbnb: 4.3, booking: 8.4, expedia: 4.2, hotels: 4.1, hotelbeds: 8.3, trip: 4.2 },
    { month: 'Mar 2026', airbnb: 4.6, booking: 8.9, expedia: 4.5, hotels: 4.4, hotelbeds: 8.8, trip: 4.5 },
    { month: 'Abr 2026', airbnb: 4.4, booking: 8.6, expedia: 4.3, hotels: 4.3, hotelbeds: 8.6, trip: 4.4 },
    { month: 'May 2026', airbnb: 4.5, booking: 8.8, expedia: 4.4, hotels: 4.4, hotelbeds: 8.7, trip: 4.5 },
  ].map(row => {
    const scores = Object.keys(csatScales).map(p => norm(p, row[p])).filter(v => v != null);
    const consolidated = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : null;
    return { ...row, consolidated, status: consolidated >= 85 ? 'excelente' : consolidated >= 75 ? 'aceptable' : 'accion' };
  });

  // ============ CORRELACIÓN CSAT vs KPIs (mensual) ============
  const correlacion = [
    { month: 'Dic 2025', frt: 4.8, art: 9.2, fcr: 76, esc: 8.1, csat: 86.2, trend: 'flat' },
    { month: 'Ene 2026', frt: 4.5, art: 8.8, fcr: 78, esc: 7.5, csat: 87.4, trend: 'up' },
    { month: 'Feb 2026', frt: 5.2, art: 9.6, fcr: 74, esc: 9.0, csat: 84.0, trend: 'down' },
    { month: 'Mar 2026', frt: 4.1, art: 8.2, fcr: 80, esc: 6.8, csat: 89.0, trend: 'up' },
    { month: 'Abr 2026', frt: 4.3, art: 8.5, fcr: 79, esc: 7.0, csat: 86.8, trend: 'flat' },
    { month: 'May 2026', frt: 3.8, art: 7.5, fcr: 80, esc: 6.4, csat: 88.2, trend: 'up' },
  ];

  // ============ EVALUACIONES (REAL — basadas en plantilla Pedro/Zaby) ============
  // Estructura: 5 criterios calidad 1-4, FRT, ART, FCR, Escalación
  const evaluaciones = [
    { id: 'EV-2026-05-26-PE', agentId: 'pedro', evaluator: 'Ana Carrillo', date: '2026-05-26',
      platform: 'guesty', booking: 'BK-4421 · Sarah Johnson', conversationDate: '2026-05-25', estadoFinal: 'Resuelto',
      frt: 3.2, art: 6.8, fcr: 'sí', escalado: 'no',
      relevancia: 4, completitud: 4, cortesia: 4, precision: 4, claridad: 3,
      promedio_calidad: 3.8, score: 3.8, status: 'completed', resultado: 'Excelente', type: 'Auditoría',
      fortalezas: 'Excelente manejo del tono empático.',
      mejoras: 'Verificar identificación del cliente antes de info sensible.',
    },
    { id: 'EV-2026-05-25-ZA', agentId: 'zaby', evaluator: 'Ana Carrillo', date: '2026-05-25',
      platform: 'whatsapp', booking: 'BK-4418 · Carlos Rivera', conversationDate: '2026-05-24', estadoFinal: 'Resuelto',
      frt: 2.9, art: 5.4, fcr: 'sí', escalado: 'no',
      relevancia: 4, completitud: 4, cortesia: 4, precision: 4, claridad: 4,
      promedio_calidad: 4.0, score: 4.0, status: 'completed', resultado: 'Excelente', type: 'Auditoría',
      fortalezas: 'Resolución rápida y precisa.', mejoras: '—',
    },
    { id: 'EV-2026-05-23-PE', agentId: 'pedro', evaluator: 'Ana Carrillo', date: '2026-05-23',
      platform: 'guesty', booking: 'BK-4402 · Emma Williams', conversationDate: '2026-05-22', estadoFinal: 'Resuelto',
      frt: 4.1, art: 8.2, fcr: 'sí', escalado: 'no',
      relevancia: 4, completitud: 3, cortesia: 4, precision: 4, claridad: 3,
      promedio_calidad: 3.6, score: 3.6, status: 'completed', resultado: 'Bueno', type: 'Auditoría',
      fortalezas: 'Buen seguimiento del caso.', mejoras: 'Mejorar claridad en instrucciones de check-in.',
    },
    { id: 'EV-2026-05-21-ZA', agentId: 'zaby', evaluator: 'Ana Carrillo', date: '2026-05-21',
      platform: 'guesty', booking: 'BK-4391 · Liam Schmidt', conversationDate: '2026-05-20', estadoFinal: 'Resuelto',
      frt: 3.5, art: 7.1, fcr: 'sí', escalado: 'no',
      relevancia: 4, completitud: 4, cortesia: 4, precision: 3, claridad: 4,
      promedio_calidad: 3.8, score: 3.8, status: 'completed', resultado: 'Excelente', type: 'Auditoría',
      fortalezas: 'Cortesía sobresaliente.', mejoras: 'Confirmar números de reserva.',
    },
    { id: 'EV-2026-05-19-PE', agentId: 'pedro', evaluator: 'Ana Carrillo', date: '2026-05-19',
      platform: 'whatsapp', booking: 'BK-4378 · Olivia Brown', conversationDate: '2026-05-18', estadoFinal: 'Escalado',
      frt: 5.8, art: 11.2, fcr: 'no', escalado: 'sí', motivoEsc: 'Plomería compleja', escA: 'Mauricio',
      relevancia: 3, completitud: 3, cortesia: 4, precision: 3, claridad: 3,
      promedio_calidad: 3.2, score: 3.2, status: 'flagged', resultado: 'Aceptable', type: 'Coaching',
      fortalezas: 'Reconoció rápido la complejidad.', mejoras: 'FRT y ART por encima del target. Documentar mejor el caso.',
    },
    { id: 'EV-2026-05-18-ZA', agentId: 'zaby', evaluator: 'Ana Carrillo', date: '2026-05-18',
      platform: 'guesty', booking: 'BK-4365 · Noah Davis', conversationDate: '2026-05-17', estadoFinal: 'Resuelto',
      frt: 3.1, art: 6.4, fcr: 'sí', escalado: 'no',
      relevancia: 4, completitud: 4, cortesia: 4, precision: 4, claridad: 3,
      promedio_calidad: 3.8, score: 3.8, status: 'completed', resultado: 'Excelente', type: 'Auditoría',
      fortalezas: 'Comunicación clara.', mejoras: 'Cierre podría incluir ofrecimiento adicional.',
    },
    { id: 'EV-2026-05-16-PE', agentId: 'pedro', evaluator: 'Ana Carrillo', date: '2026-05-16',
      platform: 'guesty', booking: 'BK-4349 · Ava García', conversationDate: '2026-05-15', estadoFinal: 'Resuelto',
      frt: 4.4, art: 8.6, fcr: 'sí', escalado: 'no',
      relevancia: 4, completitud: 4, cortesia: 3, precision: 4, claridad: 4,
      promedio_calidad: 3.8, score: 3.8, status: 'completed', resultado: 'Excelente', type: 'Auditoría',
      fortalezas: 'Información precisa.', mejoras: 'Mejorar el saludo inicial.',
    },
    { id: 'EV-2026-05-14-ZA', agentId: 'zaby', evaluator: 'Ana Carrillo', date: '2026-05-14',
      platform: 'whatsapp', booking: 'BK-4336 · Lucas Martin', conversationDate: '2026-05-13', estadoFinal: 'Resuelto',
      frt: 3.6, art: 7.8, fcr: 'sí', escalado: 'no',
      relevancia: 4, completitud: 4, cortesia: 4, precision: 4, claridad: 4,
      promedio_calidad: 4.0, score: 4.0, status: 'completed', resultado: 'Excelente', type: 'Auditoría',
      fortalezas: 'Excelente en todos los criterios.', mejoras: '—',
    },
  ];

  // Rúbrica oficial — 5 criterios escala 1-4 (de plantilla real)
  const rubric = [
    { id: 'relevancia',  label: 'Relevancia',     desc: 'Abordó directamente la solicitud del huésped' },
    { id: 'completitud', label: 'Completitud',    desc: 'Respuesta completa, sin dejar dudas' },
    { id: 'cortesia',    label: 'Cortesía y Tono', desc: 'Profesional, amable y apropiado' },
    { id: 'precision',   label: 'Precisión',      desc: 'Información correcta y sin errores' },
    { id: 'claridad',    label: 'Claridad',       desc: 'Fácil de entender y bien estructurada' },
  ];
  const calidadEscala = [
    { v: 1, label: 'Deficiente', color: 'oklch(0.62 0.22 25)' },
    { v: 2, label: 'Aceptable',  color: 'oklch(0.74 0.16 75)' },
    { v: 3, label: 'Bueno',      color: 'oklch(0.62 0.16 254)' },
    { v: 4, label: 'Excelente',  color: 'oklch(0.62 0.16 155)' },
  ];

  // ============ ALERTAS ============
  const alerts = [
    { id: 1, level: 'critical', kpi: 'FRT',  msg: 'FRT en cola WhatsApp > 5 min en últimas 2h', agent: null, time: 'hace 8 min', ref: 'frt' },
    { id: 2, level: 'warning',  kpi: 'ART',  msg: 'ART promedio Pedro subió a 8.6 min este mes', agent: 'Pedro Castillo', time: 'hace 1h', ref: 'art' },
    { id: 3, level: 'info',     kpi: 'CSAT', msg: 'CSAT Mayo: 88.2/100 — mejor del trimestre', agent: null, time: 'hace 3h', ref: 'csat' },
    { id: 4, level: 'warning',  kpi: 'Esc.', msg: '1 escalación a Mauricio · caso plomería complejo', agent: 'Pedro Castillo', time: 'hace 5h', ref: 'esc' },
    { id: 5, level: 'info',     kpi: 'QA',   msg: 'Zaby alcanzó 4.0/4 en última evaluación', agent: 'Zaby Hernández', time: 'hace 6h', ref: 'qa' },
  ];

  // ============ AUDIT LOG (snapshot) ============
  const audit = [
    { id: 1, ts: '2026-05-27T14:24:00', actor: 'pedro@praiahotel.com', actorName: 'Pedro Castillo', action: 'UPDATE', table: 'Tickets', rowId: tickets[0]?.id, delta: { status: { from: 'abierto', to: 'proceso' } }, payload: null },
    { id: 2, ts: '2026-05-27T14:18:00', actor: 'zaby@praiahotel.com',  actorName: 'Zaby Hernández',  action: 'CREATE', table: 'Tickets', rowId: tickets[1]?.id, delta: null, payload: { priority: 'alta', issue: 'plomeria' } },
    { id: 3, ts: '2026-05-27T13:48:00', actor: 'ana.carrillo@praiahotel.com', actorName: 'Ana Carrillo', action: 'CREATE', table: 'Evaluations', rowId: 'EV-2026-05-26-PE', delta: null, payload: { agentId: 'pedro', score: 3.8 } },
    { id: 4, ts: '2026-05-27T13:12:00', actor: 'pedro@praiahotel.com', actorName: 'Pedro Castillo', action: 'UPDATE', table: 'Tickets', rowId: tickets[2]?.id, delta: { status: { from: 'proceso', to: 'cerrado' } }, payload: null },
    { id: 5, ts: '2026-05-27T11:58:00', actor: 'ana.carrillo@praiahotel.com', actorName: 'Ana Carrillo', action: 'UPDATE', table: 'CSAT', rowId: 'May 2026', delta: { consolidated: { from: 86.8, to: 88.2 } }, payload: null },
    { id: 6, ts: '2026-05-27T10:42:00', actor: 'pedro@praiahotel.com', actorName: 'Pedro Castillo', action: 'LOGIN', table: 'Users', rowId: 'pedro', delta: null, payload: null },
    { id: 7, ts: '2026-05-27T09:18:00', actor: 'zaby@praiahotel.com',  actorName: 'Zaby Hernández',  action: 'COMMENT', table: 'Tickets', rowId: tickets[5]?.id, delta: null, payload: { text: 'Coordinado con mantenimiento — técnico llega 16:00' } },
    { id: 8, ts: '2026-05-26T18:42:00', actor: 'ana.carrillo@praiahotel.com', actorName: 'Ana Carrillo', action: 'CREATE', table: 'Evaluations', rowId: 'EV-2026-05-25-ZA', delta: null, payload: { agentId: 'zaby', score: 4.0 } },
  ];

  // ============ HELPERS ============
  function makeSeries(seed, n, base, amp) {
    const r2 = rng(seed);
    const out = [];
    let v = base;
    for (let i = 0; i < n; i++) {
      v += (r2() - 0.5) * amp;
      v = Math.max(base * 0.6, Math.min(base * 1.4, v));
      out.push(v);
    }
    return out;
  }
  function makeHeatmap() {
    const r2 = rng(42);
    const grid = [];
    for (let d = 0; d < 7; d++) {
      const row = [];
      for (let h = 0; h < 24; h++) {
        const hourFactor = (h >= 10 && h <= 13) ? 0.8 : (h >= 15 && h <= 19) ? 0.95 : (h >= 7 && h <= 22) ? 0.45 : 0.12;
        const dayFactor = d === 5 || d === 6 ? 0.7 : 1.0;
        row.push(Math.min(1, hourFactor * dayFactor * (0.7 + r2() * 0.5)));
      }
      grid.push(row);
    }
    return grid;
  }
  function ago(ts) {
    const diff = (now - new Date(ts)) / 1000;
    if (diff < 60) return 'hace ' + Math.floor(diff) + 's';
    if (diff < 3600) return 'hace ' + Math.floor(diff / 60) + ' min';
    if (diff < 86400) return 'hace ' + Math.floor(diff / 3600) + 'h';
    return 'hace ' + Math.floor(diff / 86400) + 'd';
  }
  function duration(from, to) {
    const ms = new Date(to) - new Date(from);
    const m = Math.floor(ms / 60000);
    if (m < 60) return m + ' min';
    const h = Math.floor(m / 60);
    if (h < 24) return h + 'h ' + (m % 60 ? (m % 60) + 'min' : '');
    return Math.floor(h / 24) + 'd ' + (h % 24) + 'h';
  }
  function slaProgress(t) {
    const created = new Date(t.createdAt);
    const dead = new Date(t.slaDeadline);
    const ref = t.status === 'cerrado' ? new Date(t.closedAt) : now;
    return Math.max(0, Math.min(150, ((ref - created) / (dead - created)) * 100));
  }

  return {
    agents, users, escalation_targets, apartments, issues, platforms, tickets,
    kpis, alerts, evaluaciones, rubric, calidadEscala, audit,
    csatHistory, csatScales, correlacion,
    colors, SLA_HOURS, NOW: now,
    makeSeries, makeHeatmap, ago, duration, slaProgress, norm,
  };
})();
