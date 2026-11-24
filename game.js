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

/* ===== CONTORNO DAS AMÉRICAS: polígonos com 300 vértices no total ===== */
// Pontos-guia desenhados à mão; "densify" acrescenta vértices com leve irregularidade (semente fixa) até fechar a contagem.
const LAND = [
  { n: 230, seed: 7, amp: 5, pts: [[30,75],[45,35],[110,25],[170,38],[230,25],[300,40],[350,55],[382,88],[402,116],[450,125],[470,145],[468,178],[440,196],[400,202],[376,218],[372,250],[346,276],[336,310],[330,350],[326,386],[310,380],[296,352],[268,346],[238,366],[232,388],[252,402],[272,420],[292,432],[312,446],[302,472],[330,482],[352,500],[386,520],[410,540],[432,556],[470,542],[520,545],[565,555],[602,570],[618,590],[620,622],[628,650],[632,690],[612,730],[602,762],[590,792],[578,822],[580,852],[568,868],[545,888],[520,888],[492,908],[472,932],[452,956],[422,975],[392,976],[380,958],[366,938],[360,900],[342,862],[336,820],[332,780],[324,740],[312,700],[308,668],[316,630],[338,596],[348,572],[340,552],[334,540],[300,524],[262,512],[240,488],[206,468],[188,448],[166,440],[150,410],[140,392],[118,360],[100,332],[84,300],[78,262],[84,226],[74,190],[68,150],[54,120],[30,112],[20,88]] },
  { n: 28, seed: 3, amp: 3, pts: [[420,10],[470,8],[510,25],[515,55],[490,85],[470,100],[445,90],[430,60],[415,35]] },
  { n: 16, seed: 5, amp: 2, pts: [[322,430],[345,416],[385,420],[408,433],[382,444],[342,446],[324,440]] },
  { n: 12, seed: 9, amp: 2, pts: [[410,448],[440,441],[460,452],[451,469],[420,471]] },
  { n: 14, seed: 11, amp: 2, pts: [[474,480],[500,477],[514,495],[491,507],[471,499]] }
];

function densify({ pts, n: total, seed, amp }) {
  let s = seed;
  const rand = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  const n = pts.length, extra = total - n;
  const len = pts.map((p, i) => Math.hypot(pts[(i + 1) % n][0] - p[0], pts[(i + 1) % n][1] - p[1]));
  const per = len.reduce((a, b) => a + b, 0);
  const add = len.map(l => Math.floor(extra * l / per));
  const rest = extra - add.reduce((a, b) => a + b, 0);
  len.map((l, i) => [extra * l / per - add[i], i]).sort((a, b) => b[0] - a[0]).slice(0, rest).forEach(([, i]) => add[i]++);
  const out = [];
  pts.forEach((a, i) => {
    const b = pts[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], k = add[i];
    out.push(a);
    for (let j = 1; j <= k; j++) {
      const t = j / (k + 1), off = (rand() - .5) * 2 * Math.min(amp, len[i] / (k + 1) * .6);
      out.push([a[0] + dx * t - dy / len[i] * off, a[1] + dy * t + dx / len[i] * off]);
    }
  });
  return out;
}
const LAND_SHAPES = LAND.map(densify); // total de vértices: LAND_SHAPES.flat().length === 300

/* ===== CONFIGURAÇÃO ===== */
const MAX_PLAYERS = 8, MAX_NAME = 10;
const COLOR_NAMES = ["Coral", "Céu", "Menta", "Mel", "Lilás", "Pêssego", "Turquesa", "Areia"]; // cores em style.css (--p0..--p7)
const KEY_AUTO = "war-americas:auto:v1", KEY_SLOT = "war-americas:slot:v1";
const PHASES = ["distribute", "attack", "redistribute"];
const $ = s => document.querySelector(s);
const esc = t => String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ===== ESTADO ===== */
/* state = { players:[{name,color}], owner, armies, selected,
             turn, round, phase, pool, placed, inbound, winner, log } */
let state = null;
const IDS = Object.keys(TERRITORIES);
const colorOf = p => state.players[p].color;
const count = p => IDS.filter(id => state.owner[id] === p).length;
const alive = p => count(p) > 0;
const poolFor = p => Math.max(1, Math.floor(count(p) / 2)); // metade dos territórios, arredondada para baixo (mínimo 1)
const movable = id => state.armies[id] - 1 - (state.inbound[id] || 0); // exército que acabou de chegar não se move de novo
const roll = () => 1 + Math.floor(Math.random() * 6);

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function startTurn(turn, round) {
  Object.assign(state, { turn, round, phase: "distribute", pool: poolFor(turn), placed: {}, inbound: {}, selected: null });
}

function newGame(players) {
  const owner = {}, armies = {};
  shuffle([...IDS]).forEach((id, i) => { owner[id] = i % players.length; armies[id] = 1 + Math.floor(Math.random() * 3); });
  state = { players, owner, armies, winner: null, log: [] };
  startTurn(0, 1);
  render();
}

function log(msg) { state.log.push(msg); state.log = state.log.slice(-8); }

/* ===== MECÂNICA DE TURNO ===== */
function nextPhase() {
  if (state.winner != null) return;
  if (state.phase === "distribute") {
    if (state.pool > 0) return;
    state.phase = state.round === 1 ? "redistribute" : "attack"; // 1ª rodada: sem disputa
    state.inbound = {};
  } else if (state.phase === "attack") {
    state.phase = "redistribute"; state.inbound = {};
  } else {
    const n = state.players.length;
    for (let i = 1; i <= n; i++) {
      const t = (state.turn + i) % n;
      if (alive(t)) { startTurn(t, t <= state.turn ? state.round + 1 : state.round); break; }
    }
  }
  state.selected = null;
  render();
}

function undoPlacement() {
  for (const id in state.placed) { state.armies[id] -= state.placed[id]; state.pool += state.placed[id]; }
  state.placed = {}; render();
}

function doAttack(from, to) {
  const me = state.players[state.turn].name, foe = state.owner[to];
  const da = Math.min(3, state.armies[from] - 1), dd = Math.min(3, state.armies[to]);
  const ra = Array.from({ length: da }, roll).sort((a, b) => b - a);
  const rd = Array.from({ length: dd }, roll).sort((a, b) => b - a);
  let lossA = 0, lossD = 0;
  for (let i = 0; i < Math.min(da, dd); i++) ra[i] > rd[i] ? lossD++ : lossA++; // empate favorece a defesa
  state.armies[from] -= lossA; state.armies[to] -= lossD;
  let msg = `${esc(me)} ${TERRITORIES[from][0]} → ${TERRITORIES[to][0]}: ataque [${ra.join(" ")}] × defesa [${rd.join(" ")}] (−${lossA} / −${lossD})`;
  if (state.armies[to] === 0) {
    const mv = Math.max(1, da - lossA); // os atacantes sobreviventes ocupam o território
    state.owner[to] = state.turn; state.armies[from] -= mv; state.armies[to] = mv;
    msg += ` — conquistou ${TERRITORIES[to][0]}!`;
    if (!alive(foe)) msg += ` ${esc(state.players[foe].name)} foi eliminado.`;
    const vivos = state.players.map((_, i) => i).filter(alive);
    if (vivos.length === 1) { state.winner = vivos[0]; state.phase = "end"; }
    state.selected = to;
  }
  log(msg); render();
}

function targets(sel) {
  const t = new Set();
  if (sel == null || state.winner != null || state.owner[sel] !== state.turn) return t;
  for (const v of NEIGHBORS[sel]) {
    if (state.phase === "attack" && state.armies[sel] >= 2 && state.owner[v] !== state.turn) t.add(v);
    if (state.phase === "redistribute" && movable(sel) > 0 && state.owner[v] === state.turn) t.add(v);
  }
  return t;
}

function onTerritory(id) {
  const sel = state.selected;
  if (state.winner == null) {
    if (state.phase === "distribute" && state.owner[id] === state.turn && state.pool > 0) {
      state.armies[id]++; state.pool--; state.placed[id] = (state.placed[id] || 0) + 1; state.selected = id; return render();
    }
    if (sel != null && targets(sel).has(id)) {
      if (state.phase === "attack") return doAttack(sel, id);
      state.armies[sel]--; state.armies[id]++; state.inbound[id] = (state.inbound[id] || 0) + 1; return render();
    }
  }
  state.selected = sel === id ? null : id; render();
}

/* ===== SALVAR / CARREGAR ===== */
function serialize() {
  const { players, owner, armies, turn, round, phase, pool, placed, inbound, winner, log } = state;
  return JSON.stringify({ version: 2, savedAt: Date.now(), players, owner, armies, turn, round, phase, pool, placed, inbound, winner, log });
}

function parseSave(text) {
  try {
    const d = JSON.parse(text);
    if (![1, 2].includes(d.version) || !Array.isArray(d.players) || d.players.length < 2 || d.players.length > MAX_PLAYERS) return null;
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
    if (d.version === 1) Object.assign(d, { turn: 0, round: 1, phase: "distribute", pool: null, placed: {}, inbound: {}, winner: null, log: [] });
    if (!Number.isInteger(d.turn) || d.turn < 0 || d.turn >= d.players.length) return null;
    if (!Number.isInteger(d.round) || d.round < 1) return null;
    if (![...PHASES, "end"].includes(d.phase)) return null;
    if (d.pool != null && (!Number.isInteger(d.pool) || d.pool < 0)) return null;
    d.placed = d.placed && typeof d.placed === "object" ? d.placed : {};
    d.inbound = d.inbound && typeof d.inbound === "object" ? d.inbound : {};
    d.log = Array.isArray(d.log) ? d.log.filter(x => typeof x === "string").slice(-8) : [];
    return d;
  } catch { return null; }
}

function restore(d) {
  state = { players: d.players, owner: d.owner, armies: d.armies, turn: d.turn, round: d.round, phase: d.phase,
    pool: d.pool, placed: d.placed, inbound: d.inbound, winner: d.winner ?? null, log: d.log, selected: null };
  if (state.pool == null) state.pool = poolFor(state.turn);
  render();
}

function status(msg) {
  const s = $("#status"); s.textContent = msg;
  clearTimeout(status.t); status.t = setTimeout(() => s.textContent = "", 4000);
}
function readStore(key) { try { return localStorage.getItem(key); } catch { return null; } }
function writeStore(key, val) { try { localStorage.setItem(key, val); return true; } catch { return false; } }

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
  resizeDraft(n); renderSetup(); $("#setup").showModal();
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
      b.onclick = () => {
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
  $("#setup").close(); newGame(players); status("Novo jogo iniciado.");
}

/* ===== RENDERIZAÇÃO ===== */
const svg = $("#map"), NS = "http://www.w3.org/2000/svg";
const el = (name, attrs = {}) => {
  const n = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
  return n;
};

function buildMap() {
  svg.innerHTML = "";
  const land = el("path", { class: "land", d: LAND_SHAPES.map(poly => "M" + poly.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join("L") + "Z").join("") });
  svg.appendChild(land);
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
    g.addEventListener("click", () => onTerritory(id));
    g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onTerritory(id); } });
    svg.appendChild(g);
  });
}

function render() {
  const sel = state.selected, tg = targets(sel);
  document.querySelectorAll(".terr").forEach(g => {
    const id = g.dataset.id;
    g.setAttribute("class", "terr owner-" + colorOf(state.owner[id])
      + (id === sel ? " selected" : "")
      + (sel && NEIGHBORS[sel].has(id) ? " neighbor" : "")
      + (tg.has(id) ? " target" : "")
      + (sel && id !== sel && !NEIGHBORS[sel].has(id) ? " dim" : ""));
    g.querySelector(".n").textContent = state.armies[id];
  });
  document.querySelectorAll(".edges line").forEach(l =>
    l.classList.toggle("active", !!sel && (l.dataset.a === sel || l.dataset.b === sel)));
  renderTurn(); renderInfo(); renderPlayers();
  writeStore(KEY_AUTO, serialize()); // salvamento automático
}

function renderTurn() {
  const box = $("#turn");
  const logHtml = state.log.length ? "<ul class='log'>" + state.log.slice().reverse().map(m => `<li>${m}</li>`).join("") + "</ul>" : "";
  if (state.winner != null) {
    const w = state.players[state.winner];
    box.innerHTML = `<h2><span class="dot owner-${w.color}"></span>${esc(w.name)} venceu!</h2><p>Conquistou todas as Américas.</p>${logHtml}`;
    return;
  }
  const p = state.players[state.turn];
  const nome = { distribute: "1. Distribuir exércitos", attack: "2. Atacar", redistribute: "3. Remanejar" }[state.phase];
  const dica = {
    distribute: `Clique nos seus territórios para colocar exércitos. Restam <b>${state.pool}</b>.`,
    attack: "Selecione um território seu com 2+ exércitos e clique num vizinho inimigo (destacado) para atacar.",
    redistribute: "Selecione um território seu e clique num vizinho seu para mover 1 exército. Cada território mantém ao menos 1."
  }[state.phase];
  const proximo = { distribute: state.round === 1 ? "Ir ao remanejamento" : "Ir ao ataque", attack: "Ir ao remanejamento", redistribute: "Encerrar turno" }[state.phase];
  box.innerHTML = `<h2><span class="dot owner-${p.color}"></span>Vez de ${esc(p.name)}</h2>
    <p>Rodada ${state.round} · <b>${nome}</b>${state.round === 1 ? " · sem ataques na 1ª rodada" : ""}</p>
    <p>${dica}</p>
    <div class="actions left">
      <button id="nextPhase" class="primary" ${state.phase === "distribute" && state.pool > 0 ? "disabled" : ""}>${proximo}</button>
      ${state.phase === "distribute" && Object.keys(state.placed).length ? '<button id="undo">Desfazer</button>' : ""}
    </div>${logHtml}`;
  $("#nextPhase").onclick = nextPhase;
  const u = $("#undo"); if (u) u.onclick = undoPlacement;
}

function renderInfo() {
  const box = $("#info"), id = state.selected;
  if (!id) { box.innerHTML = ""; return; }
  const [nome, cont] = TERRITORIES[id];
  const dono = state.players[state.owner[id]];
  const viz = [...NEIGHBORS[id]].map(v => {
    const o = state.players[state.owner[v]];
    return `<li><span class="dot owner-${o.color}"></span>${TERRITORIES[v][0]} <b>${state.armies[v]}</b> <span class="stats">${esc(o.name)}</span></li>`;
  }).join("");
  box.innerHTML = `<h3>${nome}</h3>
    <p>${CONTINENTS[cont].nome} · ${esc(dono.name)} · ${state.armies[id]} exércitos</p><ul>${viz}</ul>`;
}

function renderPlayers() {
  const rows = state.players.map((p, i) => {
    const conts = Object.keys(CONTINENTS).filter(c => IDS.every(id => TERRITORIES[id][1] !== c || state.owner[id] === i));
    const troops = IDS.reduce((s, id) => s + (state.owner[id] === i ? state.armies[id] : 0), 0);
    return `<li class="${alive(i) ? "" : "out"}"><span class="dot owner-${p.color}"></span><b>${esc(p.name)}</b>${i === state.turn && state.winner == null ? " ◀" : ""}
      <span class="stats">${count(i)} territórios · ${troops} exércitos${conts.length ? " · " + conts.map(c => CONTINENTS[c].nome).join(", ") : ""}</span></li>`;
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
