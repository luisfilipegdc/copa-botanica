// Copa Botânica — service worker
// Páginas: sempre da rede (versão nova); sem internet, mostra o aviso de offline.
// Arquivos (css, js, ícones, fontes, bibliotecas): guardados para abrir rápido.
// Supabase (respostas, placar, tempo real) NUNCA passa por aqui.
const VERSAO = 'copa-v2';
const BASE = ['/offline.html', '/estilo.css', '/comum.js', '/manifest.webmanifest',
  '/icones/icone-192.png', '/icones/icone-512.png', '/icones/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => Promise.all([
    c.addAll(BASE.filter((u) => u !== '/offline.html')),
    // guarda o aviso de offline como resposta "limpa" (a Vercel redireciona /offline.html para /offline)
    fetch('/offline.html').then((r) => r.text()).then((html) => c.put('/offline.html', new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }))),
  ])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.hostname.endsWith('supabase.co')) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('/offline.html')));
    return;
  }
  const guardavel = url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com/.test(url.hostname);
  if (!guardavel) return;
  e.respondWith(caches.open(VERSAO).then((c) => {
    const daRede = () => fetch(req).then((r) => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; });
    // arquivos do próprio site: rede primeiro (nunca mistura versão velha com nova); guardado só sem internet
    if (url.origin === location.origin) return daRede().catch(() => c.match(req));
    // bibliotecas e fontes externas (versão fixa): guardado primeiro, mais rápido
    return c.match(req).then((g) => g || daRede());
  }));
});
