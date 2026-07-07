// Lógica pura do torneio: distribuição em grupos, geração de confrontos
// (rodízio nos grupos e mata-mata com byes), classificação e semeadura.
// Sem dependências de React/Supabase — reutilizável no servidor e no cliente.

import type { Match, Team, TeamStats } from "./types";

type NewMatch = Omit<Match, "created_at" | "updated_at">;

function uuid(): string {
  // Disponível em Node 18+ e navegadores modernos.
  return crypto.randomUUID();
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// --------------------------------------------------------------------------
// GRUPOS
// --------------------------------------------------------------------------

// Distribui os times em `numGroups` grupos de forma equilibrada (serpente),
// embaralhando antes para não depender da ordem de cadastro.
export function distributeIntoGroups(
  teamIds: string[],
  numGroups: number
): string[][] {
  const groups: string[][] = Array.from({ length: numGroups }, () => []);
  const ids = shuffle(teamIds);
  ids.forEach((id, i) => {
    groups[i % numGroups].push(id);
  });
  return groups;
}

// Rodízio (todos contra todos) dentro de um grupo.
export function generateGroupMatches(
  groupId: string,
  teamIds: string[],
  startOrder: number
): NewMatch[] {
  const matches: NewMatch[] = [];
  let order = startOrder;
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      matches.push({
        id: uuid(),
        phase: "group",
        round: 0,
        round_label: "Fase de Grupos",
        order_index: order++,
        group_id: groupId,
        team_a_id: teamIds[i],
        team_b_id: teamIds[j],
        games_a: 0,
        games_b: 0,
        status: "pending",
        winner_id: null,
        loser_id: null,
        next_match_id: null,
        next_match_slot: null,
      });
    }
  }
  return matches;
}

// --------------------------------------------------------------------------
// CLASSIFICAÇÃO
// --------------------------------------------------------------------------

// Ordena um conjunto de estatísticas (de um grupo) pelos critérios de desempate:
// partidas ganhas > saldo de jogos > jogos ganhos > nome.
export function rankStats(stats: TeamStats[]): TeamStats[] {
  return [...stats].sort((a, b) => {
    if (b.matches_won !== a.matches_won) return b.matches_won - a.matches_won;
    if (b.games_diff !== a.games_diff) return b.games_diff - a.games_diff;
    if (b.games_won !== a.games_won) return b.games_won - a.games_won;
    return a.team_name.localeCompare(b.team_name);
  });
}

// Monta a lista ordenada (semeada) de classificados para o mata-mata.
// Pega os N primeiros de cada grupo e intercala por posição: todos os 1ºs
// (ranqueados entre si), depois todos os 2ºs, etc. Assim os líderes de grupo
// ficam nas melhores sementes e evitam-se cedo.
export function seedQualifiers(
  statsByGroup: Record<string, TeamStats[]>,
  qualifiersPerGroup: number
): string[] {
  const byPosition: TeamStats[][] = [];
  for (const groupId of Object.keys(statsByGroup)) {
    const ranked = rankStats(statsByGroup[groupId]);
    for (let pos = 0; pos < qualifiersPerGroup; pos++) {
      if (!byPosition[pos]) byPosition[pos] = [];
      if (ranked[pos]) byPosition[pos].push(ranked[pos]);
    }
  }
  const ordered: string[] = [];
  for (const bucket of byPosition) {
    const ranked = rankStats(bucket);
    for (const s of ranked) ordered.push(s.team_id);
  }
  return ordered;
}

// --------------------------------------------------------------------------
// MATA-MATA (bracket de eliminação simples com byes)
// --------------------------------------------------------------------------

function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

// Ordem padrão de sementes numa chave (spread dos cabeças de chave).
// Ex.: size 8 -> [1,8,5,4,3,6,7,2]
function seedOrder(size: number): number[] {
  let seeds = [1, 2];
  while (seeds.length < size) {
    const sum = seeds.length * 2 + 1;
    const next: number[] = [];
    for (const s of seeds) {
      next.push(s);
      next.push(sum - s);
    }
    seeds = next;
  }
  return seeds;
}

function roundLabel(matchesInRound: number): string {
  switch (matchesInRound) {
    case 1:
      return "Final";
    case 2:
      return "Semifinal";
    case 4:
      return "Quartas de Final";
    case 8:
      return "Oitavas de Final";
    case 16:
      return "16-avos de Final";
    default:
      return `Rodada de ${matchesInRound * 2}`;
  }
}

// Gera todos os confrontos do mata-mata a partir da lista ordenada (semeada)
// de IDs de times. Já resolve byes (auto-avanço) da primeira rodada.
export function generateBracket(
  orderedTeamIds: string[],
  startOrder: number
): NewMatch[] {
  const n = orderedTeamIds.length;
  if (n < 2) return [];

  const size = nextPow2(n);
  const order = seedOrder(size);
  const numRounds = Math.log2(size);

  const teamForSeed = (seed: number): string | null =>
    seed <= n ? orderedTeamIds[seed - 1] : null;

  // Cria as rodadas (arrays de partidas), ainda sem vínculos.
  const rounds: NewMatch[][] = [];

  const makeMatch = (
    round: number,
    matchesInRound: number,
    teamA: string | null,
    teamB: string | null
  ): NewMatch => ({
    id: uuid(),
    phase: "knockout",
    round,
    round_label: roundLabel(matchesInRound),
    order_index: 0, // atribuído no final
    group_id: null,
    team_a_id: teamA,
    team_b_id: teamB,
    games_a: 0,
    games_b: 0,
    status: "pending",
    winner_id: null,
    loser_id: null,
    next_match_id: null,
    next_match_slot: null,
  });

  // Rodada 1
  const r1: NewMatch[] = [];
  const r1Count = size / 2;
  for (let i = 0; i < size; i += 2) {
    const teamA = teamForSeed(order[i]);
    const teamB = teamForSeed(order[i + 1]);
    r1.push(makeMatch(1, r1Count, teamA, teamB));
  }
  rounds.push(r1);

  // Rodadas seguintes (vazias)
  let prev = r1;
  for (let r = 2; r <= numRounds; r++) {
    const count = prev.length / 2;
    const cur: NewMatch[] = [];
    for (let i = 0; i < count; i++) cur.push(makeMatch(r, count, null, null));
    rounds.push(cur);
    prev = cur;
  }

  // Vincula cada partida à próxima (next_match_id / slot).
  const byId = new Map<string, NewMatch>();
  rounds.flat().forEach((m) => byId.set(m.id, m));
  for (let r = 0; r < rounds.length - 1; r++) {
    const cur = rounds[r];
    const nxt = rounds[r + 1];
    for (let i = 0; i < cur.length; i++) {
      const target = nxt[Math.floor(i / 2)];
      cur[i].next_match_id = target.id;
      cur[i].next_match_slot = i % 2 === 0 ? "a" : "b";
    }
  }

  // Resolve byes da rodada 1: partida com apenas um time -> avança direto.
  for (const m of rounds[0]) {
    const hasA = !!m.team_a_id;
    const hasB = !!m.team_b_id;
    if (hasA !== hasB) {
      const winner = (m.team_a_id ?? m.team_b_id) as string;
      m.status = "done";
      m.winner_id = winner;
      m.loser_id = null;
      // coloca o vencedor no slot da próxima partida
      if (m.next_match_id) {
        const target = byId.get(m.next_match_id)!;
        if (m.next_match_slot === "a") target.team_a_id = winner;
        else target.team_b_id = winner;
      }
    }
  }

  // Atribui order_index sequencial (rodada a rodada) para agenda/carrossel.
  let order_index = startOrder;
  for (const round of rounds) {
    for (const m of round) m.order_index = order_index++;
  }

  return rounds.flat();
}

// --------------------------------------------------------------------------
// MELHOR DE N — resultado de um jogo
// --------------------------------------------------------------------------

// Aplica a vitória de um jogo a uma partida e devolve o novo estado.
// Retorna também o vencedor da partida (se decidida) para propagar na chave.
export function applyGameWin(
  match: Pick<Match, "games_a" | "games_b" | "team_a_id" | "team_b_id" | "status">,
  winnerSlot: "a" | "b",
  bestOf: number
): { games_a: number; games_b: number; status: Match["status"]; winner_id: string | null; loser_id: string | null } {
  const winsNeeded = Math.floor(bestOf / 2) + 1;
  let games_a = match.games_a + (winnerSlot === "a" ? 1 : 0);
  let games_b = match.games_b + (winnerSlot === "b" ? 1 : 0);

  let status: Match["status"] = "live";
  let winner_id: string | null = null;
  let loser_id: string | null = null;

  if (games_a >= winsNeeded) {
    status = "done";
    winner_id = match.team_a_id;
    loser_id = match.team_b_id;
  } else if (games_b >= winsNeeded) {
    status = "done";
    winner_id = match.team_b_id;
    loser_id = match.team_a_id;
  }

  return { games_a, games_b, status, winner_id, loser_id };
}

// Ajuda para telas: agrupa times por grupo.
export function groupTeams(teams: Team[]): Record<string, Team[]> {
  const out: Record<string, Team[]> = {};
  for (const t of teams) {
    const g = t.group_id ?? "sem-grupo";
    (out[g] ??= []).push(t);
  }
  return out;
}
