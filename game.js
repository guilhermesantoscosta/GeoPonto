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

function calcDeployPoints(playerIdx) {
  const count = IDS.filter(id => state.owner[id] === playerIdx).length;
  return Math.max(1, Math.floor(count / 2));
}

function initTurn(turnIdx, round) {
  state.turn = turnIdx;
  state.round = round;
  state.phase = "deploy";
  state.pool = calcDeployPoints(turnIdx);
  state.selected = null;
}

function select(id) {
  const owner = {}, armies = {};
  shuffle([...IDS]).forEach((id, i) => {
    owner[id] = i % players.length;
    armies[id] = 1 + Math.floor(Math.random() * 3);
  });
  state = { players, owner, armies, turn: 0, round: 1, phase: "deploy", pool: 0, selected: null };
  initTurn(0, 1);
  render();
}

function endTurn() {
  let next = state.turn, round = state.round;
  for (let i = 0; i < state.players.length; i++) {
    next = (next + 1) % state.players.length;
    if (next === 0) round++;
    if (IDS.some(id => state.owner[id] === next)) break;
  }
  initTurn(next, round);
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

// Polígonos das Américas e ilhas principais (~300 vértices alinhados ao viewBox 640x980)
const LAND_POLYGONS = [
  // América do Norte + América Central
  "35,55 48,42 68,38 92,36 118,42 145,45 172,42 200,38 228,40 255,46 272,58 265,75 248,88 262,102 285,108 308,118 325,132 348,130 375,126 402,128 430,132 452,142 458,158 442,172 418,178 395,186 382,202 368,218 358,238 345,258 332,280 322,302 315,325 308,348 298,362 288,350 282,332 268,325 248,332 232,348 222,368 215,392 218,415 228,432 248,442 268,438 278,448 268,462 256,475 272,482 292,485 315,492 338,502 356,518 375,532 392,546 398,560 382,562 362,552 342,538 320,526 298,522 276,512 254,496 232,478 212,458 192,438 175,416 162,392 152,368 142,344 128,325 115,302 105,276 98,248 92,220 88,192 85,165 78,138 68,112 52,95 36,82 28,68 35,55 " +
  "42,62 58,52 80,48 105,50 132,54 160,52 188,48 215,50 240,56 250,70 235,84 245,98 270,112 295,124 318,138 345,138 375,135 405,138 432,145 442,158 425,168 398,175 375,188 360,208 348,230 335,252 322,275 312,298 305,322 296,340 286,322 270,315 245,322 225,338 212,362 204,388 206,415 218,438 238,452 258,455 248,472 265,488 288,495 312,505 335,518 358,534 380,550 365,546 340,530 315,516 290,508 265,495 242,476 220,455 198,432 178,408 164,382 152,355 138,330 122,304 112,276 104,246 98,216 94,185 88,155 78,125 62,100 44,82",
  // Groenlândia
  "395,35 415,24 440,20 468,22 492,30 508,45 505,64 492,82 475,96 455,106 435,108 418,98 405,82 396,65 390,48 395,35 408,42 428,32 452,30 476,36 492,50 486,68 468,84 445,94 422,86 408,66",
  // Ilha Baffin
  "285,68 305,60 328,62 348,72 362,88 358,105 342,116 320,118 298,110 284,95 280,80 285,68 298,74 320,72 342,82 346,98 325,106 302,98",
  // Cuba, Hispaniola e Antilhas
  "325,425 345,418 368,420 390,428 396,438 378,444 352,442 330,435",
  "408,448 428,442 450,446 456,458 440,466 416,464 405,456",
  "475,475 492,472 506,482 508,498 495,508 480,502 472,488",
  // América do Sul
  "395,558 418,552 442,550 468,552 495,556 522,562 548,570 572,582 588,598 598,618 605,640 608,665 604,690 598,715 592,740 586,765 578,790 568,815 556,838 540,858 520,876 498,892 476,908 456,924 438,940 420,954 402,962 386,958 376,942 370,920 365,895 360,868 356,840 354,812 352,784 350,756 348,728 345,700 340,672 338,645 344,620 356,598 372,578 386,564 395,558 " +
  "405,568 432,562 462,562 492,566 522,574 550,584 574,598 588,620 594,648 592,678 586,708 578,738 570,768 560,796 546,824 528,848 506,870 482,890 458,910 434,930 410,946 392,944 382,920 374,890 368,858 364,825 360,790 356,755 352,718 348,680 350,645 364,612 384,585"
];

function buildMap() {
  svg.innerHTML = "";

  // Camada 1: Mar azul ao fundo
  svg.appendChild(el("rect", {
    x: 0, y: 0, width: 640, height: 980,
    fill: "#4a8db7"
  }));

  // Camada 2: Continente verde poligonal (~300 vértices)
  const landGroup = el("g", { class: "continent-bg" });
  LAND_POLYGONS.forEach(pts => {
    landGroup.appendChild(el("polygon", {
      points: pts,
      fill: "#6ab070",
      stroke: "#48854e",
      "stroke-width": "2",
      "stroke-linejoin": "round"
    }));
  });
  svg.appendChild(landGroup);

  // Camada 3: Linhas de fronteira (original mantido)
  const lines = el("g", { class: "edges" });
  EDGES.forEach(([a, b]) => {
    const [, , x1, y1] = TERRITORIES[a], [, , x2, y2] = TERRITORIES[b];
    lines.appendChild(el("line", { x1, y1, x2, y2, "data-a": a, "data-b": b }));
  });
  svg.appendChild(lines);

  // Camada 4: Territórios e nomes (original mantido)
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

function select(id) {
  if (state.phase === "deploy") {
    if (state.owner[id] !== state.turn) return status("Clique em um território SEU para distribuir pontos.");
    if (state.pool <= 0) return status("Você já distribuiu todos os seus pontos!");
    state.armies[id]++;
    state.pool--;
    state.selected = id;
    render();
    return;
  }
  state.selected = state.selected === id ? null : id;
  render();
}

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
  const box = $("#info");
  const curPlayer = state.players[state.turn];

  const sel = state.selected;
  let selDetails = "";
  if (sel) {
    const [nome, cont] = TERRITORIES[sel];
    const dono = state.players[state.owner[sel]];
    const viz = [...NEIGHBORS[sel]].map(v => {
      const o = state.players[state.owner[v]];
      return `<li><span class="dot owner-${o.color}"></span>${TERRITORIES[v][0]} <b>${state.armies[v]}</b> <span class="stats">${esc(o.name)}</span></li>`;
    }).join("");
    selDetails = `<hr><h3>${nome}</h3>
      <p>${CONTINENTS[cont].nome} · ${esc(dono.name)} · ${state.armies[sel]} exércitos</p>
      <ul>${viz}</ul>`;
  }

  box.innerHTML = `
    <div class="turn-box">
      <p><span class="dot owner-${curPlayer.color}"></span> <b>${esc(curPlayer.name)}</b> (Rodada ${state.round})</p>
      <p>Fase: <b>Distribuição</b> · Pontos restantes: <b>${state.pool}</b></p>
      <button id="nextTurnBtn" class="turn-btn" ${state.pool > 0 ? "disabled" : ""}>Passar turno →</button>
    </div>
    ${selDetails}
  `;
  $("#nextTurnBtn").onclick = endTurn;
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
