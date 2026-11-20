// Service worker mínimo: torna o app instalável e mostra uma página offline
// simples. Dados financeiros NUNCA ficam em cache (sempre rede).
const OFFLINE_HTML = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sem conexão</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0f17;color:#f9fafb;font-family:system-ui,sans-serif;text-align:center;padding:24px}h1{font-size:20px}p{color:#94a3b8}button{margin-top:12px;background:#10b981;color:#fff;border:0;border-radius:8px;padding:10px 18px;font-size:15px}</style></head><body><div><h1>Sem conexão</h1><p>O Finan precisa de internet para mostrar seus dados.</p><button onclick="location.reload()">Tentar de novo</button></div></body></html>`;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(
      () => new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } }),
    ),
  );
});
