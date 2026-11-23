// Copa Botânica Marista Asa Sul 2026 — partes comuns (aluno, telão e banco de perguntas)
const SUPA_URL = 'https://mxsriyawfdyvkwtpygko.supabase.co';
const SUPA_KEY = 'sb_publishable_TzHhR_F1imnlxBDhhGQyEQ_kB6oC0yf';

// Estágios de evolução: cada vitória = uma novidade evolutiva
const ESTAGIOS = [
  { e: '🌱', nome: 'Briófita', ganho: 'Você começa como um musgo: sem vasos, dependendo da água.' },
  { e: '🌿', nome: 'Pteridófita', ganho: 'Ganhou VASOS CONDUTORES (xilema e floema)!' },
  { e: '🌲', nome: 'Gimnosperma', ganho: 'Ganhou SEMENTE e GRÃO DE PÓLEN: não depende mais da água!' },
  { e: '🌸', nome: 'Angiosperma', ganho: 'Ganhou FLOR e DUPLA FECUNDAÇÃO!' },
  { e: '🍎', nome: 'Angiosperma com fruto', ganho: 'Ganhou FRUTO: a semente agora vem protegida!' },
  { e: '🌳', nome: 'Árvore centenária', ganho: 'Câmbio e felogênio a todo vapor: crescimento secundário!' },
  { e: '🌍', nome: 'Floresta inteira', ganho: 'Você virou um ecossistema!' },
];
const estagio = (n) => ESTAGIOS[Math.min(n || 0, ESTAGIOS.length - 1)];
const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];

const FATOS = [
  'Musgos não têm vasos: a água passa de célula em célula, por isso eles são baixinhos.',
  'A rolha de vinho é súber: células mortas cheias de suberina.',
  'O pólen das gimnospermas viaja pelo vento por quilômetros.',
  'A parte da samambaia que você vê é o esporófito (2n).',
  'O endosperma do milho e do arroz (3n) é o que a gente come.',
  'Pinheiros não têm fruto: a semente é "nua".',
  'Os pontinhos marrons embaixo da folha da samambaia são os soros, cheios de esporos.',
  'Angiospermas são o maior grupo de plantas: mais de 300 mil espécies.',
];

async function rpc(fn, args) {
  const r = await fetch(`${SUPA_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args || {}),
  });
  const txt = await r.text();
  const dado = txt ? JSON.parse(txt) : null;
  if (!r.ok) throw new Error((dado && (dado.message || dado.hint)) || `Erro ${r.status}`);
  return dado;
}

// Relógio do servidor (todos os prazos usam a hora do Supabase)
let DESVIO = 0;
function ajustarRelogio(agoraServidor, enviadoEm) {
  const recebido = Date.now();
  const meio = enviadoEm ? (enviadoEm + recebido) / 2 : recebido;
  DESVIO = new Date(agoraServidor).getTime() - meio;
}
const agoraSrv = () => Date.now() + DESVIO;
const ms = (iso) => (iso ? new Date(iso).getTime() : 0);

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const primeiroNome = (n) => String(n || '').split(' ')[0];
const curto = (n) => { const p = String(n || '').split(' '); return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : p[0]; };

// Tempo real: avisa quando o estado da sala muda
function assinarSala(codigo, aoMudar) {
  if (!window.supabase) return null;
  const cli = window.supabase.createClient(SUPA_URL, SUPA_KEY, { realtime: { params: { eventsPerSecond: 5 } } });
  const canal = cli.channel('sala-' + codigo)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'jogos', filter: `codigo=eq.${codigo}` },
      (p) => p.new && aoMudar(p.new))
    .subscribe();
  return canal;
}

// Atualiza na tela só os contadores de tempo (sem redesenhar tudo)
setInterval(() => {
  document.querySelectorAll('[data-fim]').forEach((el) => {
    const fim = +el.dataset.fim, ini = +(el.dataset.ini || 0);
    const rest = Math.max(0, fim - agoraSrv());
    if (el.classList.contains('barra-tempo')) {
      const tot = fim - ini || 1;
      el.style.setProperty('--p', Math.max(0, Math.min(1, rest / tot)));
      el.classList.toggle('urgente', rest < 5000);
    } else el.textContent = Math.ceil(rest / 1000);
  });
}, 150);

// Sons curtos (sem arquivos)
let AUDIO = null;
function som(tipo) {
  try {
    AUDIO = AUDIO || new (window.AudioContext || window.webkitAudioContext)();
    const notas = { certo: [523, 659, 784], errado: [220, 180], tic: [880], fanfarra: [523, 659, 784, 1047, 784, 1047], entrou: [660, 990], inicio: [392, 523] }[tipo] || [440];
    notas.forEach((f, i) => {
      const o = AUDIO.createOscillator(), g = AUDIO.createGain();
      o.type = tipo === 'errado' ? 'sawtooth' : 'triangle'; o.frequency.value = f;
      const t = AUDIO.currentTime + i * 0.12;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      o.connect(g).connect(AUDIO.destination); o.start(t); o.stop(t + 0.3);
    });
  } catch (e) { /* sem som, tudo bem */ }
}
const vibrar = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };

// Confete simples em canvas
function confete(segundos = 4) {
  const c = document.createElement('canvas');
  c.className = 'confete'; document.body.appendChild(c);
  const ctx = c.getContext('2d'); const W = (c.width = innerWidth), H = (c.height = innerHeight);
  const cores = ['#f4c430', '#e85d75', '#4fb477', '#5aa9e6', '#b07be0', '#ff9f43'];
  const ps = Array.from({ length: 160 }, () => ({ x: Math.random() * W, y: -Math.random() * H, r: 4 + Math.random() * 6, c: cores[(Math.random() * cores.length) | 0], vy: 2 + Math.random() * 4, vx: -2 + Math.random() * 4, a: Math.random() * 6 }));
  const fim = Date.now() + segundos * 1000;
  (function passo() {
    ctx.clearRect(0, 0, W, H);
    ps.forEach((p) => { p.y += p.vy; p.x += p.vx; p.a += 0.1; ctx.fillStyle = p.c; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore(); if (p.y > H && Date.now() < fim) p.y = -10; });
    if (Date.now() < fim + 3000) requestAnimationFrame(passo); else c.remove();
  })();
}

// Ranking geral por pólen (todos que jogaram)
function ranking(estado) {
  return Object.entries(estado.j || {})
    .filter(([, p]) => !p.x)
    .sort((a, b) => (b[1].p - a[1].p) || (b[1].e - a[1].e) || (b[1].a - a[1].a))
    .map(([id, p]) => ({ id, ...p }));
}

// Símbolo: copa de árvore (a "copa" do campeonato) com flores, faixa "BOTÂNICA" e raízes
const LOGO = `<svg class="logo" viewBox="0 0 200 210" role="img" aria-label="Copa Botânica">
  <g fill="none" stroke="#a0703f" stroke-width="5" stroke-linecap="round">
    <path d="M100 150 C98 168 84 178 60 186"/><path d="M100 150 C102 170 118 180 142 188"/>
    <path d="M100 152 C100 172 96 186 92 200"/><path d="M84 176 C74 180 66 192 64 202" stroke-width="3.5"/>
    <path d="M118 178 C128 184 134 194 136 204" stroke-width="3.5"/>
  </g>
  <path d="M90 104 L110 104 L116 152 L84 152 Z" fill="#7a5232"/>
  <g>
    <circle cx="100" cy="72" r="44" fill="#2f7d46"/><circle cx="60" cy="86" r="30" fill="#2f7d46"/><circle cx="140" cy="86" r="30" fill="#2f7d46"/>
    <circle cx="76" cy="50" r="28" fill="#3f9a5c"/><circle cx="124" cy="50" r="28" fill="#3f9a5c"/><circle cx="100" cy="34" r="27" fill="#4fb477"/>
    <circle cx="100" cy="74" r="30" fill="#3f9a5c"/><circle cx="88" cy="40" r="12" fill="#a8d672" opacity=".55"/>
  </g>
  <g>${[[62,74,'#e8607a'],[100,26,'#f7f2e2'],[134,64,'#f2c230'],[84,96,'#f7f2e2'],[120,98,'#e8607a'],[48,98,'#f2c230'],[150,96,'#f7f2e2'],[104,62,'#e8607a'],[74,44,'#f2c230']]
    .map(([x, y, c]) => `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map((a) => `<circle r="4.2" cx="${(5 * Math.cos(a * Math.PI / 180)).toFixed(1)}" cy="${(5 * Math.sin(a * Math.PI / 180)).toFixed(1)}" fill="${c}"/>`).join('')}<circle r="2.6" fill="#b88a07"/></g>`).join('')}</g>
  <path d="M22 122 L36 116 L36 142 L22 136 L28 129 Z M178 122 L164 116 L164 142 L178 136 L172 129 Z" fill="#b88a07"/>
  <rect x="34" y="114" width="132" height="30" rx="5" fill="#f2c230"/>
  <text x="100" y="136" text-anchor="middle" font-family="Fredoka, Nunito, sans-serif" font-weight="600" font-size="21" letter-spacing="2" fill="#3a2a00">BOTÂNICA</text>
</svg>`;
const MARCA = `<div class="marca">${LOGO}<div><b>Copa Botânica</b><small>Marista Asa Sul · 2026</small></div></div>`;

// ---------- App instalável (PWA) ----------
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
let PEDIDO_INSTALAR = null;
const EH_APP = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const EH_IOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); PEDIDO_INSTALAR = e; document.dispatchEvent(new Event('instalavel')); });
addEventListener('appinstalled', () => { PEDIDO_INSTALAR = null; document.dispatchEvent(new Event('instalavel')); });
function botaoInstalar() {
  if (EH_APP) return '';
  if (PEDIDO_INSTALAR) return '<button class="btn sec" data-instalar>📲 Instalar o app da Copa</button>';
  if (EH_IOS) return '<p class="dica-ios">📲 Quer o app? Toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>.</p>';
  return '';
}
document.addEventListener('click', async (e) => {
  if (!e.target.closest('[data-instalar]') || !PEDIDO_INSTALAR) return;
  PEDIDO_INSTALAR.prompt();
  try { await PEDIDO_INSTALAR.userChoice; } catch (er) {}
  PEDIDO_INSTALAR = null; document.dispatchEvent(new Event('instalavel'));
});
