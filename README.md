# PRAIA Operations Console v2.0

**Sistema de gestión operativa para hoteles boutique**

Plataforma integral de seguimiento de tickets, KPIs operativos y evaluaciones de agentes ATC en tiempo real.

---

## 🎯 Características principales

### 📊 Dashboard Ejecutivo
- Resumen de 4 KPIs operativos (FRT, ART, FCR, CSAT)
- Gráfico de tendencias de últimos 30 días
- Estado de tickets en tiempo real
- Tabla de tickets abiertos recientes

### 🎟️ Gestión de Tickets
- Listado completo de tickets (48+ registros)
- Filtros por estado (Abierto, En proceso, Espera, Cerrado)
- Búsqueda por ID, apartamento o huésped
- Crear nuevos tickets con formulario modal
- Asignación por agente y prioridad

### 📈 KPIs Operativos COPC
- **FRT** (Tiempo Primera Respuesta): 3.8 min
- **ART** (Tiempo Promedio Respuesta): 7.5 min
- **FCR** (Resolución 1er Contacto): 80%
- **CSAT** (Satisfacción Consolidada): 87/100
- Targets COPC y progreso visual
- Histórico gráfico de 30 días

### 👥 Gestión de Agentes
- 2 agentes ATC (Pedro Castillo, Zaby Hernández)
- Métricas por agente (Calidad QA, FRT, Tickets)
- Evaluaciones recientes con notas
- Click para expandir detalles

### 🌓 Dark Mode
- Toggle Claro/Oscuro en sidebar
- Persistencia en localStorage
- Tokens de color optimizados

---

## 🔐 Credenciales Demo

| Email | Contraseña | Rol |
|-------|-----------|-----|
| ana.carrillo@praiahotel.com | demo-praia-2026 | Admin |
| pedro@praiahotel.com | demo-praia-2026 | Agente |
| zaby@praiahotel.com | demo-praia-2026 | Agente |

**Admin** ve: Dashboard + KPIs (botones de gestión)  
**Agente** ve: Tickets + Agentes (lectura)

---

## 🚀 Cómo usar

### Opción 1: Local (Más rápido)
1. Descarga `index.html`
2. Abre en tu navegador (doble clic o arrastra al navegador)
3. Listo — sin instalación

### Opción 2: GitHub Pages (Compartir)
1. Ve a https://github.com/new
2. Crea repo: `praia-desktop`
3. Sube `index.html`
4. Settings → Pages → Deploy from `main/(root)`
5. Tu URL: `https://tu-usuario.github.io/praia-desktop/`

### Opción 3: Servidor web
```bash
# Con Python 3
python -m http.server 8000

# Con Node.js
npx http-server

# Abre http://localhost:8000
```

---

## 📱 Navegación

**Sidebar izquierdo:**
- 🏠 **Dashboard** — Resumen ejecutivo (Admin)
- 📊 **KPIs** — Detalle operativo (Admin)
- 💬 **Tickets** — Gestión de solicitudes
- 👥 **Agentes** — Equipo y evaluaciones
- 🌙 **Oscuro/Claro** — Toggle de tema
- Cerrar sesión

---

## 🎨 Diseño & Tecnología

**Frontend:**
- React 18.3.1 (CDN, sin build)
- Babel 7.29 (transpilación inline)
- Chart.js 4.4 (gráficos)

**Estilo:**
- IBM Plex Sans/Mono/Serif (Google Fonts)
- OKLch color space (tokens dinámicos)
- CSS Grid + Flexbox

**Datos:**
- Mock data JSON (48 tickets, 30 días histórico)
- LocalStorage (dark mode persistence)
- Sin backend requerido

---

## 📊 Datos Demo

### Tickets
- 48 tickets generados aleatoriamente
- Distribuidos por: estado, prioridad, apartamento, agente
- Descriptions: WiFi, Plumbing, Cleaning, Check-in, AC

### KPIs
- Valores actuales + targets COPC
- Tendencias de ±0.3 a ±2.1%
- Histórico de 30 días con variación realista

### Agentes
- Pedro Castillo: QA 3.6/4, FRT 4.2 min, 87 tickets
- Zaby Hernández: QA 3.8/4, FRT 3.4 min, 92 tickets
- 3 evaluaciones cada uno con notas

---

## 🔧 Personalización

### Cambiar colores
En `<style>`, edita `--accent`, `--ok`, `--warn`, `--crit`:
```css
--accent: oklch(0.62 0.18 254); /* Azul actual */
--ok: oklch(0.62 0.16 155);     /* Verde */
--warn: oklch(0.74 0.16 75);    /* Naranja */
--crit: oklch(0.62 0.22 25);    /* Rojo */
```

### Cambiar tipografía
Edita `--font-sans`, `--font-mono`, `--font-serif` en `:root`

### Agregar usuarios
En MOCK_DATA.agents, agrega objeto:
```javascript
{ id: 'username', name: 'Nombre', role: 'Agente ATC', short: 'XX', email: 'user@praiahotel.com', qa: 3.5, frt: 4.0, tickets: 80, color: 'oklch(...)' }
```

### Conectar backend real
Reemplaza MOCK_DATA con fetch a Google Sheets o API REST

---

## 📋 Validaciones & Estados

**Tickets:**
- ✅ Abierto (rojo)
- ⏳ En proceso (naranja)
- ⏸️ Espera (amarillo)
- ✓ Cerrado (verde)

**Prioridades:**
- 🔴 Alta
- 🟠 Media
- 🟢 Baja

**KPIs:**
- ✓ Cumple (verde, ≥ target)
- ⚠ Por debajo (naranja, < target)

---

## 🖥️ Requisitos

- Navegador moderno (Chrome, Firefox, Safari, Edge)
- JavaScript habilitado
- Conexión a internet (para fonts + Chart.js)

---

## 📞 Soporte

**Problemas comunes:**

| Problema | Solución |
|----------|----------|
| Gráfico en blanco | Refresca (F5) después de 2 seg |
| Dark mode no persiste | Borra cookies/cache del navegador |
| Login no funciona | Usa exactamente los emails demo |
| Lento en GitHub Pages | Primer load toma 2-3 seg (CDN) |

---

## 📝 Notas de desarrollo

- **Single file:** Todo HTML + CSS + JS en un solo archivo
- **No dependencies:** Solo React + Babel + Chart.js vía CDN
- **Demo data:** Generada con Math.random() cada sesión
- **Responsive:** 240px sidebar + content flexible
- **Accesible:** Contraste WCAG AA, navegación por teclado

---

## 🎓 Próximos pasos

- [ ] Conectar Google Sheets como backend
- [ ] Agregar más agentes dinámicamente
- [ ] Importar datos reales de Guesty
- [ ] Reportes exportables (PDF)
- [ ] Notificaciones por WhatsApp
- [ ] Mobile app (React Native)

---

**Versión:** 2.0  
**Última actualización:** Mayo 27, 2026  
**Licencia:** Propietario PRAIA Hotel  
**Soporte:** ana.carrillo@praiahotel.com
