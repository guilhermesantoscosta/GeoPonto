// ============================================================
// game.js — Mecânica, pontuação e estado do jogo
// (independente da renderização; pode ser testado isoladamente)
// ============================================================

// 8 cores pastel distintas e pré-organizadas
export const PLAYER_COLORS = [
  '#FF9B9B', // vermelho pastel
  '#FFC18C', // laranja pastel
  '#FFEB8C', // amarelo pastel
  '#A5E8B8', // verde pastel
  '#8CC8F0', // azul pastel
  '#BFA8E0', // roxo pastel
  '#F0A5C8', // rosa pastel
  '#8CD9C8', // turquesa pastel
];

export const PLAYER_NAMES = [
  'Vermelho', 'Laranja', 'Amarelo', 'Verde',
  'Azul', 'Roxo', 'Rosa', 'Turquesa',
];

// ---------- Geração do mapa hexagonal (axial coords) ----------
const HEX_DIRECTIONS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

function generateHexCoords(radius) {
  const coords = [];
  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) {
      const s = -q - r;
      if (Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) <= radius) {
        coords.push([q, r]);
      }
    }
  }
  return coords;
}

function buildTerritories(radius = 3) {
  const coords = generateHexCoords(radius);
  const territories = coords.map(([q, r], i) => ({
    id: i, q, r,
    owner: null,
    points: 0,
    neighbors: [],
  }));
  const lookup = new Map();
  territories.forEach(t => lookup.set(`${t.q},${t.r}`, t.id));
  territories.forEach(t => {
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const key = `${t.q + dq},${t.r + dr}`;
      if (lookup.has(key)) t.neighbors.push(lookup.get(key));
    }
  });
  return territories;
}

// 37 territórios — bom para 2 a 8 jogadores
export const TERRITORIES = buildTerritories(3);

// ============================================================
// Classe principal do jogo
// ============================================================
export class TerritoryGame {
  constructor(playerCount, options = {}) {
    if (playerCount < 2 || playerCount > 8) {
      throw new Error('O jogo aceita de 2 a 8 jogadores');
    }
    this.maxRounds = options.maxRounds ?? 20;

    this.players = Array.from({ length: playerCount }, (_, i) => ({
      id: i,
      name: PLAYER_NAMES[i],
      color: PLAYER_COLORS[i],
      territoryIds: [],
      availablePoints: 0,
      eliminated: false,
    }));

    this.territories = TERRITORIES.map(t => ({
      ...t,
      neighbors: [...t.neighbors],
      owner: null,
      points: 0,
    }));

    this.round = 1;
    this.currentPlayerIndex = 0;
    this.phase = 'distribution'; // 'distribution' | 'movement' | 'dispute'
    this.log = [];
    this.gameOver = false;
    this.winner = null;

    this.distributeTerritories();
    this.beginTurn();
  }

  // ---------- Distribuição inicial (aleatória e igual) ----------
  distributeTerritories() {
    const shuffled = [...this.territories].sort(() => Math.random() - 0.5);
    shuffled.forEach((t, i) => {
      const p = i % this.players.length;
      t.owner = p;
      t.points = 1;
      this.players[p].territoryIds.push(t.id);
    });
    const counts = this.players.map(p => p.territoryIds.length).join(', ');
    const neutral = this.territories.filter(t => t.owner === null).length;
    this.addLog(`Territórios distribuídos (${counts}). ${neutral} neutro(s) para disputa.`);
  }

  // ---------- Helpers ----------
  getTerritory(id) { return this.territories[id]; }
  getCurrentPlayer() { return this.players[this.currentPlayerIndex]; }
  getPlayer(id) { return this.players[id]; }

  addLog(msg) {
    this.log.push({ round: this.round, msg, time: Date.now() });
    if (this.log.length > 200) this.log.shift();
  }

  // ---------- Ciclo de turno ----------
  beginTurn() {
    if (this.gameOver) return;
    const p = this.getCurrentPlayer();
    if (p.eliminated || p.territoryIds.length === 0) {
      this.advancePlayer();
      return;
    }
    this.phase = 'distribution';
    p.availablePoints = p.territoryIds.length * 2; // FASE 1: 2 pontos por país
    this.addLog(`Turno de ${p.name} — Distribuindo ${p.availablePoints} pontos`);
  }

  // === FASE 1: DISTRIBUIÇÃO ===
  placePoint(territoryId) {
    if (this.phase !== 'distribution') return { ok: false, msg: 'Fase errada' };
    const p = this.getCurrentPlayer();
    const t = this.getTerritory(territoryId);
    if (!t || t.owner !== p.id) return { ok: false, msg: 'Território não é seu' };
    if (p.availablePoints <= 0) return { ok: false, msg: 'Sem pontos disponíveis' };
    t.points += 1;
    p.availablePoints -= 1;
    return { ok: true };
  }

  advanceToMovement() {
    if (this.phase !== 'distribution') return false;
    this.phase = 'movement';
    this.addLog(`${this.getCurrentPlayer().name} — Fase de Movimento`);
    return true;
  }

  // === FASE 2: DESLOCAMENTO ===
  movePoint(fromId, toId) {
    if (this.phase !== 'movement') return { ok: false, msg: 'Fase errada' };
    const p = this.getCurrentPlayer();
    const from = this.getTerritory(fromId);
    const to = this.getTerritory(toId);
    if (!from || !to) return { ok: false, msg: 'Território inválido' };
    if (from.owner !== p.id) return { ok: false, msg: 'Origem não é sua' };
    if (from.points <= 1) return { ok: false, msg: 'Mantenha ao menos 1 ponto na origem' };
    if (!from.neighbors.includes(toId)) return { ok: false, msg: 'Não são vizinhos' };
    if (to.owner !== null && to.owner !== p.id) {
      return { ok: false, msg: 'Destino pertence a outro jogador' };
    }

    from.points -= 1;
    if (to.owner === null) {
      to.owner = p.id;
      to.points = 1;
      p.territoryIds.push(to.id);
      this.addLog(`${p.name} ocupou um território neutro`);
    } else {
      to.points += 1;
    }
    return { ok: true };
  }

  advanceToDispute() {
    if (this.phase !== 'movement') return false;
    this.phase = 'dispute';
    this.addLog(`${this.getCurrentPlayer().name} — Fase de Disputa`);
    return true;
  }

  // === FASE 3: DISPUTA ===
  canAttack(fromId, toId) {
    const p = this.getCurrentPlayer();
    const from = this.getTerritory(fromId);
    const to = this.getTerritory(toId);
    return from && to
      && from.owner === p.id
      && from.points > 1
      && from.neighbors.includes(toId)
      && to.owner !== null
      && to.owner !== p.id;
  }

  rollDie() { return Math.floor(Math.random() * 6) + 1; }

  // Um dado por ponto disputado: nDice = min(pontos excedentes do atacante, pontos do defensor)
  dispute(fromId, toId) {
    if (this.phase !== 'dispute') return { ok: false, msg: 'Fase errada' };
    if (!this.canAttack(fromId, toId)) return { ok: false, msg: 'Ataque inválido' };

    const attacker = this.getCurrentPlayer();
    const from = this.getTerritory(fromId);
    const to = this.getTerritory(toId);
    const defender = this.players[to.owner];

    const surplus = from.points - 1;
    const nDice = Math.min(surplus, to.points);

    const aDice = Array.from({ length: nDice }, () => this.rollDie()).sort((a, b) => b - a);
    const dDice = Array.from({ length: nDice }, () => this.rollDie()).sort((a, b) => b - a);

    const comparisons = aDice.map((a, i) => ({
      attacker: a,
      defender: dDice[i],
      attackerWins: a > dDice[i],
    }));

    const attackerWins = comparisons.filter(c => c.attackerWins).length;
    const defenderWins = nDice - attackerWins;

    to.points -= attackerWins;
    from.points -= defenderWins;

    let conquered = false;
    if (to.points <= 0) {
      conquered = true;
      defender.territoryIds = defender.territoryIds.filter(id => id !== toId);
      to.owner = attacker.id;
      to.points = 1;
      attacker.territoryIds.push(toId);
    }

    const result = {
      ok: true, fromId, toId,
      attacker, defender,
      aDice, dDice, comparisons,
      attackerWins, defenderWins,
      conquered,
    };

    this.addLog(
      `⚔️ ${attacker.name} atacou ${defender.name}: ${attackerWins} vitória(s), ` +
      `${defenderWins} derrota(s)` + (conquered ? ' — TERRITÓRIO CONQUISTADO!' : '')
    );

    if (defender.territoryIds.length === 0) {
      defender.eliminated = true;
      this.addLog(`💀 ${defender.name} foi eliminado!`);
    }

    this.checkGameOver();
    return result;
  }

  endTurn() {
    if (this.gameOver) return;
    if (this.phase !== 'dispute') return;
    this.advancePlayer();
  }

  advancePlayer() {
    let attempts = 0;
    do {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
      if (this.currentPlayerIndex === 0) {
        this.round++;
        if (this.round > this.maxRounds) {
          this.finishByScore();
          return;
        }
      }
      attempts++;
    } while (this.getCurrentPlayer().eliminated && attempts < this.players.length * 2);

    this.beginTurn();
  }

  checkGameOver() {
    const alive = this.players.filter(p => !p.eliminated && p.territoryIds.length > 0);
    if (alive.length === 1) this.finish(alive[0]);
  }

  finish(winner) {
    this.gameOver = true;
    this.winner = winner;
    this.addLog(`🏆 ${winner.name} VENCEU o jogo!`);
  }

  finishByScore() {
    const ranked = [...this.players].sort(
      (a, b) => b.territoryIds.length - a.territoryIds.length
    );
    this.gameOver = true;
    this.winner = ranked[0];
    this.addLog(`⏱️ Limite de rodadas. ${ranked[0].name} venceu por territórios!`);
  }
}
