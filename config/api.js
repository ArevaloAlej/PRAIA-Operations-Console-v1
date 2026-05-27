// PRAIA Desktop — API Configuration
// Cambia esto para conectar con Google Apps Script real

const USE_MOCK = true; // ← CAMBIAR A false CUANDO DESPLIEGUES BACKEND

const API_URL = (() => {
  if (USE_MOCK) return '/mock';
  // Reemplaza con tu URL de Apps Script deployment:
  // https://script.google.com/macros/d/{DEPLOYMENT_ID}/userweb
  return localStorage.getItem('API_URL') || 'https://script.google.com/macros/d/DEPLOYMENT_ID/userweb';
})();

window.PRAIA_API = { USE_MOCK, API_URL };
