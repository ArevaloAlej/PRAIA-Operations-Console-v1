# PRAIA Desktop — Resumen para integración

> Sistema de gestión de tickets operativos para alquileres de corta estadía (3 edificios, 15 apartamentos). Reemplazo desktop de la app AppSheet actual. **Frontend HTML/React (CDN, sin build) + backend Google Apps Script sobre Google Sheets.**

---

## 1. Stack y arquitectura

```
┌──────────────────────────┐         ┌─────────────────────────────┐
│  index.html (SPA)        │  HTTPS  │  Apps Script Web App        │
│  React 18 + Babel CDN    │ ───────▶│  doGet / doPost             │
│  IBM Plex Sans/Mono/Serif│ ◀───────│  Auth por email + SHA-256   │
│  localStorage: sesión    │  JSON   │  Audit_Log de cada acción   │
└──────────────────────────┘         └──────────────┬──────────────┘
                                                    │
                                                    ▼
                                     ┌─────────────────────────────┐
                                     │  Google Sheet (DB)          │
                                     │  Tickets / Apartments /     │
                                     │  Agents / Users / Issues /  │
                                     │  Platforms / Audit_Log      │
                                     └─────────────────────────────┘
```

- **Frontend:** HTML único + scripts JSX cargados con `<script type="text/babel">`. Sin bundler. Estado en React, persistencia ligera en `localStorage` (clave `praia.config.v1`).
- **Backend:** un solo `.gs` desplegado como Web App ("Anyone with the link", ejecuta como propietario).
- **CORS workaround:** POST con `Content-Type: text/plain;charset=utf-8` para evitar preflight que Apps Script no maneja. El body sigue siendo JSON, parseado por `e.postData.contents`.

---

## 2. Modelo de datos (hojas de Google Sheets)

| Hoja | Campos clave |
|---|---|
| **Tickets** | `id` (TK-XXXX), `status`, `priority`, `platform`, `issue`, `apartment`, `guest`, `agent`, `description`, `createdAt`, `updatedAt`, `closedAt`, `slaDeadline` |
| **Apartments** | `id` (ej. `7834-1`), `building`, `beds`, `baths`, `capacity`, `address`, `notes` |
| **Agents** | `id`, `name`, `role`, `shift` (Mañana/Tarde/Noche), `color`, `active` |
| **Users** | `id`, `email`, `name`, `role`, `shift`, `active`, `password_hash` (SHA-256 hex), `access_level` |
| **Issues** | catálogo de tipos: limpieza, mold, plomería, A/C, wifi, ruido, llaves, tv, cocina, check-in/out, inventario, # personas |
| **Platforms** | guesty, airbnb, booking, phone, whatsapp, walkin, email |
| **Audit_Log** | `id`, `ts`, `actor`, `actorName`, `action`, `table`, `rowId`, `delta` (JSON), `payload` (JSON) |

### Enumeraciones
- **Status:** `abierto` · `proceso` · `espera` · `cerrado`
- **Priority:** `alta` (SLA 4h) · `media` (SLA 12h) · `baja` (SLA 24h) — el SLA se calcula en backend al crear.
- **ID de apartamento es string** (ej. `7834-1`). El backend lo prefija con `'` al guardar para evitar que Sheets lo convierta a fecha.

---

## 3. API (Apps Script Web App)

URL única configurada en `praia-api.js` → `API_URL`.

Toda llamada exige `email` (query param en GET, campo del body en POST) excepto `login`.

### GET `?action=…&email=…`
| action | retorna |
|---|---|
| `tickets` / `apartments` / `agents` / `issues` | filas de la hoja |
| `audit` | últimas 200 entradas (reverso) |
| `me` | usuario actual |
| `all` | bootstrap: `{tickets, apartments, agents, issues, platforms, me}` |

### POST (body JSON, header `text/plain`)
| action | body | efecto |
|---|---|---|
| `login` | `{email, password}` | valida SHA-256 vs `password_hash`, devuelve `{id,email,name,role,shift,access_level}` |
| `create` | `{ticket:{...}}` | nuevo TK-NNNN, calcula `slaDeadline`, log audit |
| `update` | `{id, patch}` | merge parcial, auto-set `closedAt` si `status='cerrado'` |
| `delete` | `{id}` | borra fila + audit |
| `comment` | `{id, comment:{text}}` | comentario guardado en Audit_Log (no en tabla propia todavía) |
| `bulk-status` | `{ids:[…], value}` | cambio masivo de estado |
| `bulk-assign` | `{ids:[…], value:agentId}` | reasignación masiva |
| `bulk-delete` | `{ids:[…]}` | borrado masivo |

### Formato de respuesta
```json
// éxito
{ "data": <resultado> }
// error
{ "error": "mensaje", "stack": "…" }
```

---

## 4. Autenticación

1. Cliente llama `PRAIA_API.login(email, password)`.
2. Backend busca en `Users` por email (case-insensitive), valida `active !== false`.
3. Compara `SHA-256(password)` en hex con `password_hash`.
4. Devuelve perfil → cliente guarda en `localStorage` bajo `praia.config.v1`.
5. Cada llamada posterior pasa `email`; el backend re-valida en `Users` (no hay JWT, no hay sesión server-side).

> **No usa OAuth ni Google Sign-in.** La identidad vive en la hoja `Users`.

---

## 5. Auditoría

Cada `CREATE / UPDATE / DELETE / COMMENT / LOGIN` deja una fila en `Audit_Log` con:
- `actor` (email), `actorName`, `action`, `table`, `rowId`
- `delta` = diff campo a campo `{ campo: {from, to} }` (excluye `updatedAt`)
- `payload` = snapshot completo para CREATE/COMMENT

La vista `view-audit` del frontend lee `?action=audit` y renderiza el feed cronológico.

---

## 6. Estructura del frontend

```
index.html                  — shell, tokens CSS (oklch), todos los estilos
praia-data.js               — mock data + helpers fmt (ago, duration)
praia-api.js                — cliente fetch + config localStorage
praia-app.jsx               — app demo (mock data)
praia-app-live.jsx          — app conectada al backend
praia-components.jsx        — átomos (avatar, status pill, priority bars, sparkline)
praia-views-dashboard.jsx   — KPIs, donut, barchart, actividad reciente
praia-views-tickets.jsx     — tabla + filtros + drawer + modal nuevo + cmd-k
praia-views-admin.jsx       — auditoría, usuarios
praia-views-other.jsx       — apartamentos, agentes, métricas
backend/praia-backend.gs    — Apps Script completo
docs/                       — análisis de gaps, arquitectura, setup
```

### Convenciones de UI
- **Tipografía:** IBM Plex Sans (UI), IBM Plex Mono (IDs, kbd, badges), IBM Plex Serif (números KPI, títulos grandes).
- **Color:** todo en `oklch()` vía variables CSS. Tema claro por defecto, `html.theme-dark` disponible. Densidad alterable con `html.density-compact`.
- **Tokens críticos:** `--accent` (azul), `--crit` (rojo), `--warn` (ámbar), `--ok` (verde) — cada uno con su variante `-soft` para fondos.
- **Acciones globales:** Command palette (⌘K), drawer derecho para detalle de ticket, modal de creación en 2 pasos, toast inferior.

---

## 7. Lo que falta / a tener en cuenta al integrar

- **Comentarios:** hoy se persisten dentro de `Audit_Log` como `payload`. Mover a hoja `Comments` propia antes de producción.
- **Sin paginación server-side:** `?action=tickets` devuelve todo. Con >1000 tickets habrá que paginar.
- **Sin webhooks / push:** el cliente hace polling manual (botón refrescar) o re-bootstrap al cambiar de vista.
- **`access_level`** está en la hoja `Users` pero el backend aún no lo usa para autorizar acciones — todo usuario activo puede hacer todo.
- **Sin rate-limit ni captcha en login.** Apps Script no expone IP del cliente.
- **Setup inicial:** ejecutar `setupSheets()` y `seedAdmin()` una vez desde el editor de Apps Script.

---

## 8. Catálogos fijos (para mapear desde otro sistema)

```yaml
status:    [abierto, proceso, espera, cerrado]
priority:  [alta, media, baja]              # SLA: 4h / 12h / 24h
platform:  [guesty, airbnb, booking, phone, whatsapp, walkin, email]
issue:     [limpieza, mold, personas, plomeria, ac, wifi, ruido,
            llaves, tv, cocina, checkin, checkout, inventario]
role:      [Operaciones, Supervisora, Limpieza, Mantenimiento, admin, agent]
shift:     [Mañana, Tarde, Noche]
building:  [7834, 7830, 7820]
```
