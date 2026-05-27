/**
 * ===========================================================================
 *  PRAIA Desktop — Apps Script backend
 *  Sistema unificado: Tickets + KPIs + QA + Auditoría
 * ===========================================================================
 *
 *  DESPLIEGUE (paso a paso):
 *  1. Crea un Google Sheet nuevo.
 *  2. Extensiones → Apps Script. Pega este archivo completo.
 *  3. Ejecuta una vez la función  setupSheets()  (crea todas las hojas).
 *  4. Ejecuta una vez la función  seedAdmin()   (crea el usuario admin inicial).
 *  5. Implementar → Nuevo implementación → Tipo: App web.
 *       Ejecutar como: Yo
 *       Acceso:       Cualquier persona con el enlace
 *  6. Copia la URL  /exec  y pégala en  config/api.js  como  API_URL.
 *
 *  CONVENCIONES:
 *  - Respuesta exitosa: { data: ... }
 *  - Respuesta error:   { error: "mensaje", stack: "..." }
 *  - POST envía Content-Type: text/plain;charset=utf-8 para evitar preflight CORS.
 *  - Todo POST/GET (excepto login) requiere  email  para validar permisos.
 * ===========================================================================
 */

const SHEETS = {
  Tickets:       ['id','status','priority','platform','issue','apartment','guest','agent','description','createdAt','updatedAt','closedAt','slaDeadline'],
  Apartments:    ['id','building','beds','baths','capacity','address','notes'],
  Agents:        ['id','email','name','role','shift','color','active'],
  Users:         ['id','email','name','role','shift','active','password_hash','access_level'],
  Issues:        ['id','label','icon'],
  Platforms:     ['id'],
  Evaluations:   ['id','agentId','evaluator','date','type','score','status','strengths','improvements','comments','followup'],
  EvaluationScores: ['id','evaluationId','itemId','score'],  // detalle por ítem de rúbrica
  Rubric:        ['id','section','weight','itemId','itemText','itemMax'],
  KPIs:          ['id','label','full','category','unit','goal','goalCmp','formula','description','active'],
  KPI_History:   ['id','kpiId','date','value'],
  Alerts:        ['id','level','kpi','message','agent','createdAt','resolvedAt','resolvedBy'],
  Audit_Log:     ['id','ts','actor','actorName','action','table','rowId','delta','payload'],
};

const SLA_HOURS = { alta: 4, media: 12, baja: 24 };

// ============================================================================
//  HTTP ENDPOINTS
// ============================================================================

function doGet(e) {
  try {
    const action = (e.parameter.action || '').toLowerCase();
    const email = e.parameter.email;
    if (action !== 'login' && !email) return _err('email is required');
    const me = action !== 'login' ? requireUser(email) : null;

    switch (action) {
      case 'tickets':    return _ok(readSheet('Tickets'));
      case 'apartments': return _ok(readSheet('Apartments'));
      case 'agents':     return _ok(readSheet('Agents'));
      case 'issues':     return _ok(readSheet('Issues'));
      case 'platforms':  return _ok(readSheet('Platforms').map(p => p.id));
      case 'evaluations':return _ok(readSheet('Evaluations'));
      case 'kpis':       return _ok(readSheet('KPIs'));
      case 'kpi_history':return _ok(readSheet('KPI_History').filter(r => !e.parameter.kpiId || r.kpiId === e.parameter.kpiId));
      case 'alerts':     return _ok(readSheet('Alerts'));
      case 'audit':      return _ok(readSheet('Audit_Log').reverse().slice(0, 200));
      case 'me':         return _ok(me);
      case 'all':        return _ok(bootstrap(me));
      default:           return _err('Unknown action: ' + action);
    }
  } catch (err) {
    return _err(err.message, err.stack);
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const action = (body.action || '').toLowerCase();

    if (action === 'login') return _ok(login(body.email, body.password));

    if (!body.email) return _err('email is required');
    const me = requireUser(body.email);

    switch (action) {
      case 'create':       return _ok(createRow(body.table || 'Tickets', body.row || body.ticket, me));
      case 'update':       return _ok(updateRow(body.table || 'Tickets', body.id, body.patch, me));
      case 'delete':       return _ok(deleteRow(body.table || 'Tickets', body.id, me));
      case 'comment':      return _ok(addComment(body.id, body.comment, me));
      case 'bulk-status':  return _ok(bulkPatch('Tickets', body.ids, { status: body.value }, me));
      case 'bulk-assign':  return _ok(bulkPatch('Tickets', body.ids, { agent: body.value },  me));
      case 'bulk-delete':  return _ok(bulkDelete('Tickets', body.ids, me));
      case 'evaluate':     return _ok(saveEvaluation(body.evaluation, me));
      case 'resolve-alert':return _ok(resolveAlert(body.id, me));
      case 'config':       return _ok(updateConfig(body.config, me));
      default:             return _err('Unknown action: ' + action);
    }
  } catch (err) {
    return _err(err.message, err.stack);
  }
}

function _ok(data) {
  return ContentService.createTextOutput(JSON.stringify({ data }))
    .setMimeType(ContentService.MimeType.JSON);
}
function _err(msg, stack) {
  return ContentService.createTextOutput(JSON.stringify({ error: msg, stack: stack || null }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
//  AUTH
// ============================================================================

function login(email, password) {
  if (!email || !password) throw new Error('Missing credentials');
  const users = readSheet('Users');
  const u = users.find(x => (x.email || '').toLowerCase() === email.toLowerCase());
  if (!u || u.active === false) throw new Error('Usuario no encontrado o inactivo');
  const hash = sha256hex(password);
  if (hash !== u.password_hash) throw new Error('Credenciales inválidas');
  log('LOGIN', 'Users', u.id, null, null, email, u.name);
  return {
    id: u.id, email: u.email, name: u.name,
    role: u.role, shift: u.shift, access_level: u.access_level || 1,
  };
}

function requireUser(email) {
  if (!email) throw new Error('email required');
  const users = readSheet('Users');
  const u = users.find(x => (x.email || '').toLowerCase() === email.toLowerCase());
  if (!u || u.active === false) throw new Error('Usuario no autorizado');
  return { id: u.id, email: u.email, name: u.name, role: u.role, shift: u.shift, access_level: u.access_level || 1 };
}

function requireAdmin(me) {
  if (!me || (me.access_level || 1) < 9) throw new Error('Forbidden — admin only');
}

// SHA-256 hex (uses Apps Script Utilities)
function sha256hex(text) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8);
  return bytes.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

// ============================================================================
//  GENERIC CRUD
// ============================================================================

function readSheet(name) {
  const sh = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sh) throw new Error('Hoja no existe: ' + name);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const header = values[0];
  return values.slice(1).filter(r => r[0] !== '' && r[0] !== null).map(r => {
    const o = {};
    header.forEach((h, i) => { o[h] = r[i] === '' ? null : r[i]; });
    return o;
  });
}

function appendRow(name, obj) {
  const sh = SpreadsheetApp.getActive().getSheetByName(name);
  const header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const row = header.map(h => obj[h] != null ? obj[h] : '');
  sh.appendRow(row);
}

function findRowByID(name, id) {
  const sh = SpreadsheetApp.getActive().getSheetByName(name);
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) return i + 1;
  }
  return -1;
}

function createRow(table, row, me) {
  if (!SHEETS[table]) throw new Error('Tabla desconocida: ' + table);

  if (table === 'Tickets') {
    row.id = row.id || 'TK-' + nextSeq('Tickets');
    row.createdAt = new Date().toISOString();
    row.updatedAt = row.createdAt;
    row.status = row.status || 'abierto';
    row.priority = row.priority || 'media';
    const hours = SLA_HOURS[row.priority] || 12;
    row.slaDeadline = new Date(Date.now() + hours * 3600 * 1000).toISOString();
    // Sheets converts "7834-1" to date — prefix with apostrophe to force text
    if (row.apartment) row.apartment = "'" + String(row.apartment).replace(/^'/, '');
  } else {
    row.id = row.id || generateId(table);
  }

  appendRow(table, row);
  log('CREATE', table, row.id, null, row, me.email, me.name);
  return row;
}

function updateRow(table, id, patch, me) {
  const sh = SpreadsheetApp.getActive().getSheetByName(table);
  const rowIdx = findRowByID(table, id);
  if (rowIdx < 0) throw new Error('No encontrado: ' + table + '/' + id);
  const header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const current = sh.getRange(rowIdx, 1, 1, header.length).getValues()[0];
  const before = {};
  header.forEach((h, i) => before[h] = current[i]);

  const next = Object.assign({}, before, patch);
  next.updatedAt = new Date().toISOString();
  if (table === 'Tickets' && patch.status === 'cerrado' && !before.closedAt) {
    next.closedAt = new Date().toISOString();
  }

  // Compute diff
  const delta = {};
  Object.keys(patch).forEach(k => {
    if (before[k] !== patch[k] && k !== 'updatedAt') {
      delta[k] = { from: before[k], to: patch[k] };
    }
  });

  const rowValues = header.map(h => next[h] != null ? next[h] : '');
  sh.getRange(rowIdx, 1, 1, header.length).setValues([rowValues]);
  log('UPDATE', table, id, delta, null, me.email, me.name);
  return next;
}

function deleteRow(table, id, me) {
  const sh = SpreadsheetApp.getActive().getSheetByName(table);
  const rowIdx = findRowByID(table, id);
  if (rowIdx < 0) throw new Error('No encontrado: ' + table + '/' + id);
  sh.deleteRow(rowIdx);
  log('DELETE', table, id, null, null, me.email, me.name);
  return { id, deleted: true };
}

function addComment(ticketId, comment, me) {
  log('COMMENT', 'Tickets', ticketId, null, { text: comment.text || '' }, me.email, me.name);
  return { ok: true };
}

function bulkPatch(table, ids, patch, me) {
  const out = [];
  ids.forEach(id => out.push(updateRow(table, id, patch, me)));
  log('BULK-' + Object.keys(patch)[0].toUpperCase(), table, ids.length + ' tickets', { [Object.keys(patch)[0]]: { from: null, to: patch[Object.keys(patch)[0]] } }, null, me.email, me.name);
  return out;
}

function bulkDelete(table, ids, me) {
  ids.sort().reverse().forEach(id => deleteRow(table, id, me));
  log('BULK-DELETE', table, ids.length + ' filas', null, null, me.email, me.name);
  return { ok: true, count: ids.length };
}

// ============================================================================
//  EVALUATIONS
// ============================================================================

function saveEvaluation(ev, me) {
  // ev: { id?, agentId, evaluator, type, date, scores: {itemId: n}, comments, strengths, improvements, followup }
  ev.id = ev.id || 'EV-' + nextSeq('Evaluations');
  ev.evaluator = ev.evaluator || me.name;
  ev.date = ev.date || new Date().toISOString().slice(0, 10);
  ev.status = ev.status || 'completed';

  // Compute total weighted score using Rubric
  const rubric = readSheet('Rubric');
  const sections = {};
  rubric.forEach(r => {
    if (!sections[r.id]) sections[r.id] = { weight: Number(r.weight), items: [] };
    sections[r.id].items.push({ itemId: r.itemId, max: Number(r.itemMax) });
  });
  let total = 0;
  Object.values(sections).forEach(sec => {
    const earned = sec.items.reduce((s, it) => s + (Number(ev.scores[it.itemId] || 0)), 0);
    const max = sec.items.reduce((s, it) => s + it.max, 0);
    const pct = max ? (earned / max) * 100 : 0;
    total += (pct * sec.weight) / 100;
  });
  ev.score = Math.round(total * 10) / 10;

  const row = {
    id: ev.id, agentId: ev.agentId, evaluator: ev.evaluator, date: ev.date,
    type: ev.type || 'Mensual', score: ev.score, status: ev.status,
    strengths: JSON.stringify(ev.strengths || []),
    improvements: JSON.stringify(ev.improvements || []),
    comments: ev.comments || '',
    followup: ev.followup || 'none',
  };
  appendRow('Evaluations', row);

  // Persist per-item scores
  Object.keys(ev.scores || {}).forEach(itemId => {
    appendRow('EvaluationScores', { id: ev.id + '-' + itemId, evaluationId: ev.id, itemId, score: ev.scores[itemId] });
  });

  log('CREATE', 'Evaluations', ev.id, null, { agentId: ev.agentId, score: ev.score }, me.email, me.name);
  return row;
}

// ============================================================================
//  ALERTS
// ============================================================================

function resolveAlert(id, me) {
  return updateRow('Alerts', id, { resolvedAt: new Date().toISOString(), resolvedBy: me.email }, me);
}

// ============================================================================
//  BOOTSTRAP
// ============================================================================

function bootstrap(me) {
  return {
    tickets:     readSheet('Tickets'),
    apartments:  readSheet('Apartments'),
    agents:      readSheet('Agents'),
    issues:      readSheet('Issues'),
    platforms:   readSheet('Platforms').map(p => p.id),
    kpis:        readSheet('KPIs'),
    evaluations: readSheet('Evaluations'),
    alerts:      readSheet('Alerts').filter(a => !a.resolvedAt),
    audit:       readSheet('Audit_Log').reverse().slice(0, 50),
    me,
  };
}

// ============================================================================
//  AUDIT
// ============================================================================

function log(action, table, rowId, delta, payload, actor, actorName) {
  try {
    const sh = SpreadsheetApp.getActive().getSheetByName('Audit_Log');
    sh.appendRow([
      'AUD-' + Utilities.getUuid().slice(0, 8),
      new Date().toISOString(),
      actor || 'system',
      actorName || '',
      action,
      table,
      rowId || '',
      delta ? JSON.stringify(delta) : '',
      payload ? JSON.stringify(payload) : '',
    ]);
  } catch (e) {
    // Don't let logging failures break the action
  }
}

// ============================================================================
//  UTILITIES
// ============================================================================

function nextSeq(table) {
  const all = readSheet(table);
  const max = all.reduce((m, r) => {
    const n = parseInt(String(r.id).replace(/\D/g, ''), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 2000);
  return String(max + 1).padStart(4, '0');
}

function generateId(table) {
  return table.slice(0, 2).toUpperCase() + '-' + Utilities.getUuid().slice(0, 6).toUpperCase();
}

// ============================================================================
//  SETUP — run once
// ============================================================================

function setupSheets() {
  const ss = SpreadsheetApp.getActive();
  Object.keys(SHEETS).forEach(name => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, SHEETS[name].length).setValues([SHEETS[name]]);
      sh.getRange(1, 1, 1, SHEETS[name].length)
        .setFontWeight('bold').setBackground('#f1f3f5');
      sh.setFrozenRows(1);
    }
  });

  // Seed catalogues
  seedIfEmpty('Issues', [
    { id: 'limpieza',   label: 'Limpieza',         icon: 'sparkles' },
    { id: 'mold',       label: 'Moho / humedad',   icon: 'alert' },
    { id: 'personas',   label: 'Exceso personas',  icon: 'users' },
    { id: 'plomeria',   label: 'Plomería',         icon: 'settings' },
    { id: 'ac',         label: 'Aire / clima',     icon: 'zap' },
    { id: 'wifi',       label: 'WiFi',             icon: 'message' },
    { id: 'ruido',      label: 'Ruido',            icon: 'bell' },
    { id: 'llaves',     label: 'Llaves / acceso',  icon: 'lock' },
    { id: 'tv',         label: 'TV',               icon: 'eye' },
    { id: 'cocina',     label: 'Cocina',           icon: 'star' },
    { id: 'checkin',    label: 'Check-in',         icon: 'arrow-up' },
    { id: 'checkout',   label: 'Check-out',        icon: 'arrow-down' },
    { id: 'inventario', label: 'Inventario',       icon: 'file' },
  ]);

  seedIfEmpty('Platforms', ['guesty','airbnb','booking','phone','whatsapp','walkin','email'].map(id => ({ id })));

  seedIfEmpty('Apartments', [
    { id: "'7834-1", building: '7834', beds: 2, baths: 1, capacity: 4, address: 'NW 7834 Unit 1' },
    { id: "'7834-2", building: '7834', beds: 2, baths: 1, capacity: 4, address: 'NW 7834 Unit 2' },
    { id: "'7834-3", building: '7834', beds: 3, baths: 2, capacity: 6, address: 'NW 7834 Unit 3' },
    { id: "'7834-4", building: '7834', beds: 2, baths: 1, capacity: 4, address: 'NW 7834 Unit 4' },
    { id: "'7834-5", building: '7834', beds: 3, baths: 2, capacity: 6, address: 'NW 7834 Unit 5' },
    { id: "'7830-1", building: '7830', beds: 3, baths: 2, capacity: 6, address: 'NW 7830 Unit 1' },
    { id: "'7830-2", building: '7830', beds: 3, baths: 2, capacity: 6, address: 'NW 7830 Unit 2' },
    { id: "'7830-3", building: '7830', beds: 2, baths: 1, capacity: 4, address: 'NW 7830 Unit 3' },
    { id: "'7830-4", building: '7830', beds: 3, baths: 2, capacity: 6, address: 'NW 7830 Unit 4' },
    { id: "'7830-5", building: '7830', beds: 2, baths: 1, capacity: 4, address: 'NW 7830 Unit 5' },
    { id: "'7820-1", building: '7820', beds: 1, baths: 1, capacity: 2, address: 'NW 7820 Unit 1' },
    { id: "'7820-2", building: '7820', beds: 1, baths: 1, capacity: 2, address: 'NW 7820 Unit 2' },
    { id: "'7820-3", building: '7820', beds: 2, baths: 1, capacity: 4, address: 'NW 7820 Unit 3' },
    { id: "'7820-4", building: '7820', beds: 1, baths: 1, capacity: 2, address: 'NW 7820 Unit 4' },
    { id: "'7820-5", building: '7820', beds: 1, baths: 1, capacity: 2, address: 'NW 7820 Unit 5' },
  ]);

  seedIfEmpty('KPIs', [
    { id: 'frt',  label: 'FRT',   full: 'First Response Time',     category: 'Operativo',     unit: 'min',  goal: 60,  goalCmp: '<=', formula: 'Σ(t_primera_respuesta − t_creación) / N tickets', description: 'Tiempo medio entre creación del ticket y primera respuesta.', active: true },
    { id: 'art',  label: 'ART',   full: 'Tiempo de resolución',    category: 'Operativo',     unit: 'min',  goal: 240, goalCmp: '<=', formula: 'Σ(closedAt − createdAt) / N tickets', description: 'Tiempo medio de resolución total.', active: true },
    { id: 'sla',  label: 'SLA',   full: 'Cumplimiento SLA',        category: 'Operativo',     unit: '%',    goal: 90,  goalCmp: '>=', formula: '(N_dentro_SLA / N_cerrados) × 100', description: 'Tickets resueltos dentro del SLA.', active: true },
    { id: 'qa',   label: 'QA',    full: 'Score de calidad',        category: 'Calidad',       unit: '/100', goal: 85,  goalCmp: '>=', formula: 'Σ(score_i × peso_i) / Σ pesos', description: 'Score ponderado de evaluaciones.', active: true },
    { id: 'fcr',  label: 'FCR',   full: 'First Contact Resolution',category: 'Calidad',       unit: '%',    goal: 75,  goalCmp: '>=', formula: '(N_resueltos_1ra / N_total) × 100', description: 'Resolución al primer contacto.', active: true },
    { id: 'resp', label: 'Resp.', full: 'Tasa de respuesta',       category: 'Operativo',     unit: '%',    goal: 95,  goalCmp: '>=', formula: '(N_respondidos / N_recibidos) × 100', description: 'Tasa de respuesta a tickets.', active: true },
    { id: 'esc',  label: 'Esc.',  full: 'Tasa de escalamiento',    category: 'Operativo',     unit: '%',    goal: 8,   goalCmp: '<=', formula: '(N_escalados / N_total) × 100', description: 'Tickets escalados a Supervisora.', active: true },
    { id: 'vol',  label: 'Vol.',  full: 'Tickets / agente · día',  category: 'Productividad', unit: '',     goal: 10,  goalCmp: '>=', formula: 'N_tickets / (N_agentes × días)', description: 'Volumen promedio por agente.', active: true },
    { id: 'occ',  label: 'Ocup.', full: 'Ocupación',               category: 'Productividad', unit: '%',    goal: 80,  goalCmp: '~',  formula: '(t_activo / t_logueado) × 100', description: 'Tiempo activo vs logueado.', active: true },
    { id: 'csat', label: 'CSAT',  full: 'Satisfacción interna',    category: 'Calidad',       unit: '/5',   goal: 4.2, goalCmp: '>=', formula: 'Σ ratings / N', description: 'Encuesta post-resolución.', active: true },
    { id: 'prod', label: 'Prod.', full: 'Productividad diaria',    category: 'Productividad', unit: '%',    goal: 85,  goalCmp: '>=', formula: '(output_real / output_esperado) × 100', description: 'Output ponderado vs capacidad.', active: true },
    { id: 'eff',  label: 'Efic.', full: 'Eficiencia operacional',  category: 'Productividad', unit: '%',    goal: 88,  goalCmp: '>=', formula: '(prod × qa × occ)^(1/3)', description: 'Eficiencia combinada.', active: true },
  ]);

  seedIfEmpty('Rubric', [
    // section, weight, itemId, itemText, itemMax
    { id: 'r1', section: 'Saludo y apertura',      weight: 10, itemId: 'r1a', itemText: 'Utiliza saludo institucional completo',   itemMax: 5 },
    { id: 'r1', section: 'Saludo y apertura',      weight: 10, itemId: 'r1b', itemText: 'Identifica al huésped correctamente',     itemMax: 5 },
    { id: 'r2', section: 'Comprensión del caso',   weight: 20, itemId: 'r2a', itemText: 'Identifica intención del huésped',        itemMax: 10 },
    { id: 'r2', section: 'Comprensión del caso',   weight: 20, itemId: 'r2b', itemText: 'Hace preguntas de validación',            itemMax: 10 },
    { id: 'r3', section: 'Resolución técnica',     weight: 30, itemId: 'r3a', itemText: 'Aplica procedimiento correcto',           itemMax: 15 },
    { id: 'r3', section: 'Resolución técnica',     weight: 30, itemId: 'r3b', itemText: 'Resuelve en primer contacto',             itemMax: 10 },
    { id: 'r3', section: 'Resolución técnica',     weight: 30, itemId: 'r3c', itemText: 'Documenta el ticket completamente',       itemMax: 5 },
    { id: 'r4', section: 'Comunicación y tono',    weight: 20, itemId: 'r4a', itemText: 'Tono empático y profesional',             itemMax: 10 },
    { id: 'r4', section: 'Comunicación y tono',    weight: 20, itemId: 'r4b', itemText: 'Claridad y ortografía',                   itemMax: 10 },
    { id: 'r5', section: 'Cierre y seguimiento',   weight: 20, itemId: 'r5a', itemText: 'Confirma resolución con el huésped',      itemMax: 10 },
    { id: 'r5', section: 'Cierre y seguimiento',   weight: 20, itemId: 'r5b', itemText: 'Cierre cordial y ofrecimiento adicional', itemMax: 10 },
  ]);

  Logger.log('✅ Sheets creadas y semilla cargada. Ejecuta seedAdmin() para crear el usuario admin.');
}

function seedIfEmpty(name, rows) {
  const sh = SpreadsheetApp.getActive().getSheetByName(name);
  if (sh.getLastRow() > 1) return;
  rows.forEach(r => appendRow(name, r));
}

/**
 * Ejecuta UNA vez después de setupSheets().
 * Cambia los valores antes de ejecutar.
 */
function seedAdmin() {
  const adminEmail = 'ana.carrillo@praia.io';
  const adminPwd   = 'cambialo-ya';   // ⚠️ CAMBIAR ANTES DE PRODUCCIÓN

  const users = readSheet('Users');
  if (users.find(u => u.email === adminEmail)) {
    Logger.log('Admin ya existe.');
    return;
  }
  appendRow('Users', {
    id: 'U-001',
    email: adminEmail,
    name: 'Ana Carrillo',
    role: 'Supervisora',
    shift: 'Mañana',
    active: true,
    password_hash: sha256hex(adminPwd),
    access_level: 9,
  });
  Logger.log('✅ Admin creado: ' + adminEmail + ' / ' + adminPwd);
}

/**
 * Para agregar usuarios después. Ejemplo:
 *   addUser('zaby.hernandez@praia.io', 'Zaby Hernández', 'Supervisora', 'Mañana', 'temporal-2026', 9);
 */
function addUser(email, name, role, shift, password, accessLevel) {
  appendRow('Users', {
    id: 'U-' + Utilities.getUuid().slice(0, 6).toUpperCase(),
    email, name, role, shift,
    active: true,
    password_hash: sha256hex(password),
    access_level: accessLevel || 1,
  });
  Logger.log('✅ Usuario agregado: ' + email);
}

/**
 * Migrar/agregar agentes — ejemplo manual.
 *   addAgent('a1', 'maria.fernandez@praia.io', 'María Fernández', 'Operaciones', 'Mañana');
 */
function addAgent(id, email, name, role, shift) {
  appendRow('Agents', {
    id, email, name, role, shift,
    color: 'oklch(0.62 0.18 254)',
    active: true,
  });
  Logger.log('✅ Agente agregado: ' + name);
}
