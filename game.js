/* ===== MAPA: territórios, continentes e fronteiras ===== */
const CONTINENTS = {
  norte:   { nome: "América do Norte",  bonus: 5 },
  central: { nome: "América Central",   bonus: 2 },
  sul:     { nome: "América do Sul",    bonus: 4 }
};

// id: [nome, continente, x, y]  (coordenadas no viewBox 640x980)
const TERRITORIES = {
  ak:  ["Alasca", "norte", 60, 60],
  yk:  ["Yukon", "norte", 130, 70],
  nw:  ["Territórios do Noroeste", "norte", 215, 65],
  bf:  ["Baffin", "norte", 320, 90],
  gl:  ["Groenlândia", "norte", 440, 50],
  bc:  ["Colúmbia Britânica", "norte", 110, 140],
  ab:  ["Alberta", "norte", 175, 150],
  mb:  ["Manitoba", "norte", 240, 160],
  on:  ["Ontário", "norte", 300, 170],
  qc:  ["Quebec", "norte", 365, 160],
  ac:  ["Canadá Atlântico", "norte", 425, 150],
  ow:  ["Oeste dos EUA", "norte", 120, 230],
  mt:  ["Montanhas Rochosas", "norte", 190, 240],
  ct:  ["Centro dos EUA", "norte", 255, 245],
  ne:  ["Nordeste dos EUA", "norte", 335, 235],
  se:  ["Sudeste dos EUA", "norte", 300, 310],
  ca:  ["Califórnia", "norte", 135, 310],
  tx:  ["Texas", "norte", 215, 330],
  mn:  ["México Norte", "central", 185, 400],
  ms:  ["México Sul", "central", 235, 450],
  gt:  ["Guatemala", "central", 280, 490],
  hn:  ["Honduras", "central", 325, 510],
  cr:  ["Costa Rica e Panamá", "central", 370, 540],
  cu:  ["Cuba", "central", 360, 430],
  hs:  ["Hispaniola", "central", 430, 455],
  pa:  ["Antilhas Menores", "central", 490, 490],
  co:  ["Colômbia", "sul", 410, 585],
  ve:  ["Venezuela", "sul", 485, 570],
  gy:  ["Guianas", "sul", 560, 585],
  ec:  ["Equador", "sul", 355, 640],
  pe:  ["Peru", "sul", 365, 700],
  bn:  ["Brasil Norte", "sul", 480, 640],
  bne: ["Brasil Nordeste", "sul", 570, 680],
  bco: ["Brasil Centro-Oeste", "sul", 490, 730],
  bse: ["Brasil Sudeste", "sul", 565, 770],
  bo:  ["Bolívia", "sul", 420, 760],
  py:  ["Paraguai", "sul", 480, 810],
  ur:  ["Uruguai e Sul do Brasil", "sul", 545, 830],
  ch:  ["Chile", "sul", 370, 830],
  ar:  ["Argentina", "sul", 440, 880],
  pt:  ["Patagônia", "sul", 400, 935]
};

// Fronteiras (bidirecionais: basta listar uma vez)
const EDGES = `ak-yk ak-bc yk-bc yk-nw nw-bc nw-ab nw-bf bf-on bf-gl gl-qc
bc-ab bc-ow ab-mb ab-ow ab-mt mb-on mb-mt mb-ct on-qc on-ct on-ne qc-ne qc-ac ac-ne
ow-mt ow-ca mt-ct mt-ca mt-tx ct-ne ct-se ct-tx ne-se se-tx se-cu ca-tx ca-mn tx-mn
mn-ms ms-gt gt-hn gt-cu hn-cr cr-co cu-hs hs-pa pa-ve
co-ve co-ec co-bn ve-gy ve-bn gy-bn ec-pe pe-co pe-bn pe-bo pe-bco
bn-bne bn-bco bne-bco bne-bse bco-bse bco-bo bco-py bse-py bse-ur
bo-py bo-ch bo-ar py-ar py-ur ur-ar ch-ar ch-pt ar-pt`
  .split(/\s+/).map(e => e.split("-"));

const NEIGHBORS = {};
Object.keys(TERRITORIES).forEach(id => NEIGHBORS[id] = new Set());
EDGES.forEach(([a, b]) => { NEIGHBORS[a].add(b); NEIGHBORS[b].add(a); });

/* ===== CONFIGURAÇÃO ===== */
const MAX_PLAYERS = 8, MAX_NAME = 10;
const COLOR_NAMES = ["Coral", "Céu", "Menta", "Mel", "Lilás", "Pêssego", "Turquesa", "Areia"]; // cores em style.css (--p0..--p7)
const KEY_AUTO = "war-americas:auto:v1", KEY_SLOT = "war-americas:slot:v1";
const $ = s => document.querySelector(s);
const esc = t => String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ===== ESTADO ===== */
// state = { players:[{name,color}], owner:{id:índiceJogador}, armies:{id:n}, selected }
let state = null;
const IDS = Object.keys(TERRITORIES);
const colorOf = p => state.players[p].color;

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function newGame(players) {
  const owner = {}, armies = {};
  shuffle([...IDS]).forEach((id, i) => { owner[id] = i % players.length; armies[id] = 1 + Math.floor(Math.random() * 3); });
  state = { players, owner, armies, selected: null };
  render();
}

/* ===== SALVAR / CARREGAR ===== */
function serialize() {
  return JSON.stringify({ version: 1, savedAt: Date.now(), players: state.players, owner: state.owner, armies: state.armies });
}

function parseSave(text) {
  try {
    const d = JSON.parse(text);
    if (d.version !== 1 || !Array.isArray(d.players) || d.players.length < 2 || d.players.length > MAX_PLAYERS) return null;
    const cores = new Set();
    for (const p of d.players) {
      if (typeof p.name !== "string" || !Number.isInteger(p.color) || p.color < 0 || p.color >= MAX_PLAYERS || cores.has(p.color)) return null;
      cores.add(p.color);
    }
    for (const id of IDS) {
      if (!Number.isInteger(d.owner?.[id]) || d.owner[id] < 0 || d.owner[id] >= d.players.length) return null;
      if (!Number.isInteger(d.armies?.[id]) || d.armies[id] < 1) return null;
    }
    d.players = d.players.map(p => ({ name: p.name.slice(0, MAX_NAME), color: p.color }));
    return d;
  } catch { return null; }
}

function restore(d) {
  state = { players: d.players, owner: d.owner, armies: d.armies, selected: null };
  render();
}

function status(msg) {
  const s = $("#status"); s.textContent = msg;
  clearTimeout(status.t); status.t = setTimeout(() => s.textContent = "", 4000);
}

function readStore(key) { try { return localStorage.getItem(key); } catch { return null; } }
function writeStore(key, val) {
  try { localStorage.setItem(key, val); return true; } catch { return false; }
}

function saveSlot() {
  status(writeStore(KEY_SLOT, serialize()) ? "Jogo salvo neste navegador." : "Não foi possível salvar (armazenamento bloqueado). Use Exportar.");
}
function loadSlot() {
  const d = parseSave(readStore(KEY_SLOT) || "");
  if (!d) return status("Nenhum jogo salvo encontrado neste navegador.");
  restore(d); status("Jogo carregado (salvo em " + new Date(d.savedAt).toLocaleString("pt-BR") + ").");
}
function exportFile() {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([serialize()], { type: "application/json" }));
  a.download = "war-americas-" + new Date().toISOString().slice(0, 10) + ".json";
  a.click(); URL.revokeObjectURL(a.href);
}
function importFile(file) {
  if (!file) return;
  file.text().then(t => {
    const d = parseSave(t);
    if (!d) return status("Arquivo inválido.");
    restore(d); status("Jogo importado.");
  });
}

/* ===== TELA DE NOVO JOGO (nomes e cores) ===== */
let draft = [];
const freeColor = () => [...Array(MAX_PLAYERS).keys()].find(c => !draft.some(p => p.color === c));

function resizeDraft(n) {
  while (draft.length > n) draft.pop();
  while (draft.length < n) draft.push({ name: "Jogador " + (draft.length + 1), color: freeColor() });
}

function openSetup() {
  const n = state ? state.players.length : 4;
  draft = state ? state.players.map(p => ({ ...p })) : [];
  $("#numPlayers").value = n;
  resizeDraft(n);
  renderSetup();
  $("#setup").showModal();
}

function renderSetup() {
  const box = $("#setupRows"); box.innerHTML = "";
  draft.forEach((p, i) => {
    const row = document.createElement("div"); row.className = "setup-row";
    const input = document.createElement("input");
    input.maxLength = MAX_NAME; input.value = p.name; input.placeholder = "Jogador " + (i + 1);
    input.setAttribute("aria-label", "Nome do jogador " + (i + 1));
    input.oninput = () => p.name = input.value;
    const sw = document.createElement("div"); sw.className = "swatches";
    for (let c = 0; c < MAX_PLAYERS; c++) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "swatch owner-" + c + (p.color === c ? " on" : "");
      b.title = COLOR_NAMES[c]; b.setAttribute("aria-label", COLOR_NAMES[c]); b.setAttribute("aria-pressed", p.color === c);
      b.onclick = () => { // se outro jogador usa a cor, trocam entre si
        const other = draft.find(q => q !== p && q.color === c);
        if (other) other.color = p.color;
        p.color = c; renderSetup();
      };
      sw.appendChild(b);
    }
    row.append(input, sw); box.appendChild(row);
  });
}

function startFromSetup() {
  const players = draft.map((p, i) => ({ name: p.name.trim().slice(0, MAX_NAME) || "Jogador " + (i + 1), color: p.color }));
  $("#setup").close();
  newGame(players);
  status("Novo jogo iniciado.");
}

/* ===== RENDERIZAÇÃO DO MAPA ===== */
const svg = $("#map"), NS = "http://www.w3.org/2000/svg";
const el = (name, attrs = {}) => {
  const n = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
  return n;
};

function buildMap() {
  svg.innerHTML = "";
  const lines = el("g", { class: "edges" });
  EDGES.forEach(([a, b]) => {
    const [, , x1, y1] = TERRITORIES[a], [, , x2, y2] = TERRITORIES[b];
    lines.appendChild(el("line", { x1, y1, x2, y2, "data-a": a, "data-b": b }));
  });
  svg.appendChild(lines);
  Object.entries(TERRITORIES).forEach(([id, [nome, , x, y]]) => {
    const g = el("g", { class: "terr", "data-id": id, tabindex: 0, role: "button", "aria-label": nome });
    g.appendChild(el("circle", { cx: x, cy: y, r: 20 }));
    const label = el("text", { x, y: y + 36, class: "label" }); label.textContent = nome;
    g.append(el("text", { x, y: y + 5, class: "n" }), label);
    g.addEventListener("click", () => select(id));
    g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(id); } });
    svg.appendChild(g);
  });
}

function select(id) { state.selected = state.selected === id ? null : id; render(); }

function render() {
  const sel = state.selected;
  document.querySelectorAll(".terr").forEach(g => {
    const id = g.dataset.id;
    g.setAttribute("class", "terr owner-" + colorOf(state.owner[id])
      + (id === sel ? " selected" : "")
      + (sel && NEIGHBORS[sel].has(id) ? " neighbor" : "")
      + (sel && id !== sel && !NEIGHBORS[sel].has(id) ? " dim" : ""));
    g.querySelector(".n").textContent = state.armies[id];
  });
  document.querySelectorAll(".edges line").forEach(l =>
    l.classList.toggle("active", !!sel && (l.dataset.a === sel || l.dataset.b === sel)));
  renderInfo(); renderPlayers();
  writeStore(KEY_AUTO, serialize()); // salvamento automático
}

function renderInfo() {
  const box = $("#info"), id = state.selected;
  if (!id) { box.innerHTML = '<p class="hint">Clique em um território para ver detalhes e fronteiras.</p>'; return; }
  const [nome, cont] = TERRITORIES[id];
  const dono = state.players[state.owner[id]];
  const viz = [...NEIGHBORS[id]].map(v => {
    const o = state.players[state.owner[v]];
    return `<li><span class="dot owner-${o.color}"></span>${TERRITORIES[v][0]} <b>${state.armies[v]}</b> <span class="stats">${esc(o.name)}</span></li>`;
  }).join("");
  box.innerHTML = `<h2>${nome}</h2>
    <p>${CONTINENTS[cont].nome} · ${esc(dono.name)} · ${state.armies[id]} exércitos</p>
    <h3>Fronteiras</h3><ul>${viz}</ul>`;
}

function renderPlayers() {
  const rows = state.players.map((p, i) => {
    const mine = IDS.filter(id => state.owner[id] === i);
    const troops = mine.reduce((s, id) => s + state.armies[id], 0);
    const conts = Object.keys(CONTINENTS).filter(c => IDS.every(id => TERRITORIES[id][1] !== c || state.owner[id] === i));
    return `<li><span class="dot owner-${p.color}"></span><b>${esc(p.name)}</b>
      <span class="stats">${mine.length} territórios · ${troops} exércitos${conts.length ? " · " + conts.map(c => CONTINENTS[c].nome).join(", ") : ""}</span></li>`;
  });
  $("#players").innerHTML = "<h3>Jogadores</h3><ul>" + rows.join("") + "</ul>";
}

/* ===== INICIALIZAÇÃO ===== */
const numSel = $("#numPlayers");
for (let n = 2; n <= MAX_PLAYERS; n++) numSel.add(new Option(n, n));
numSel.onchange = () => { resizeDraft(+numSel.value); renderSetup(); };
$("#newGame").onclick = openSetup;
$("#startGame").onclick = startFromSetup;
$("#cancelSetup").onclick = () => $("#setup").close();
$("#saveSlot").onclick = saveSlot;
$("#loadSlot").onclick = loadSlot;
$("#exportFile").onclick = exportFile;
$("#importFile").onchange = e => { importFile(e.target.files[0]); e.target.value = ""; };

buildMap();
const auto = parseSave(readStore(KEY_AUTO) || "");
if (auto) { restore(auto); status("Partida anterior retomada."); }
else { draft = []; resizeDraft(4); newGame(draft.map(p => ({ ...p }))); }
