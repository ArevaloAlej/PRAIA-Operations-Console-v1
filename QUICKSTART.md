# PRAIA Desktop — Guía de inicio rápido

## 1️⃣ Opción más rápida: Demo local (sin backend)

```bash
# Clonar y abrir
git clone https://github.com/YOUR-ORG/praia-desktop.git
cd praia-desktop
open PRAIA\ Operations\ Console.html
```

**Login demo:**
- Email: `ana.carrillo@praiahotel.com`
- Password: `demo-praia-2026`
- (O usa `pedro@` o `zaby@`)

✅ Todo funciona con datos mock. No requiere configuración.

---

## 2️⃣ Desplegar en GitHub Pages (1 minuto)

```bash
# 1. Hacer push a GitHub
git add .
git commit -m "Initial commit: PRAIA Operations Console"
git push origin main

# 2. En GitHub.com → Settings → Pages
#    - Source: main branch, root folder
#    - Tu URL: https://YOUR-ORG.github.io/praia-desktop/

# 3. Visita https://YOUR-ORG.github.io/praia-desktop/
```

✅ Frontend en vivo. Backend sigue siendo mock.

---

## 3️⃣ Conectar backend real con Google Sheets + Apps Script (5 minutos)

### Paso A: Crear Google Sheet
1. Abre https://sheets.google.com → Nuevo Sheet
2. Nómbralo: **PRAIA ATC Data**
3. Copia la ID de la URL:
   ```
   https://docs.google.com/spreadsheets/d/AQUI-ESTA-LA-ID/edit
   ```

### Paso B: Desplegar backend Apps Script
1. En el Sheet, **Extensiones → Apps Script**
2. Borra el código por defecto, copia TODO de `backend/praia-backend.gs`
3. Guarda (Ctrl+S)
4. Ejecuta función **setupSheets()** (crea todas las tablas)
   - Clic en dropdown "Selecciona función" → setupSheets
   - Clic en ▶ Ejecutar
5. Ejecuta función **seedAdmin()** (crea usuario admin)
   - Dropdown → seedAdmin → Ejecutar
6. En el menú superior, **Implementar → Nuevo implementación**
   - Tipo: **App web**
   - Ejecutar como: **Yo**
   - Acceso: **Cualquier persona con el enlace**
   - Clic en **Implementar**
7. Copia la URL que aparece (el enlace `/userweb`)

### Paso C: Conectar frontend
1. En tu proyecto, edita `config/api.js`:
   ```javascript
   const USE_MOCK = false; // CAMBIAR A false
   // Y reemplaza DEPLOYMENT_ID con el que acabas de copiar
   ```
2. Commit y push:
   ```bash
   git add config/api.js
   git commit -m "Connect to real backend"
   git push
   ```

✅ Ahora todo el frontend se conecta con Google Sheets real.

---

## 📱 Probar en móvil

```bash
# Saber tu IP local
ifconfig | grep "inet " | grep -v 127.0.0.1

# Servir localmente
python -m http.server 8000

# En móvil, visita:
# http://TU-IP-LOCAL:8000/PRAIA\ Operations\ Console.html
```

---

## 🔧 Agregar usuarios reales

En tu Google Sheet + Apps Script, ejecuta:

```javascript
// En la consola de Apps Script:
addUser('maria@praiahotel.com', 'María García', 'Operaciones', 'Tarde', 'su-password-inicial', 1);
addAgent('a3', 'maria@praiahotel.com', 'María García', 'Operaciones', 'Tarde');
```

---

## 📊 Cargar datos reales

Los archivos Excel que compartiste tienen:
- **Control_KPI_ATC_PRAIA_V1**: Targets COPC, KPIs, CSAT histórico
- **Evaluaciones_Pedro**: Plantilla de evaluaciones
- **Evaluaciones_Zaby**: Plantilla de evaluaciones

Próximo paso: exportar esos datos a CSV e importarlos a Google Sheets via script.

---

## 🆘 Troubleshooting

**P: "Conexión rechazada"**
- Verifica que el Apps Script esté publicado como "App web"
- Copia nuevamente la URL `/userweb` (no `/exec`)

**P: "CORS error"**
- Esto es esperado en desarrollo — usa `USE_MOCK = true`
- En producción, Apps Script maneja CORS automáticamente

**P: "Contraseña no válida"**
- Las contraseñas están en SHA-256 hash
- Actualiza con `seedAdmin()` o `addUser()`

---

## 📞 Próximos pasos

- [ ] Actualizar `backend/praia-backend.gs` con tus datos reales
- [ ] Crear script Python para migrar de Excel a Google Sheets
- [ ] Integrar Guesty API (opcional)
- [ ] Configurar alertas Slack/Email
- [ ] Customizar colores/logo PRAIA

---

**¿Listo?** Empieza con la Opción 1, luego la 2, y finalmente la 3 si necesitas persistencia.
