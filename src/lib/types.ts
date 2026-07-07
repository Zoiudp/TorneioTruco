// Tipos compartilhados do domínio do torneio.

export type Phase = "group" | "knockout";
export type MatchStatus = "pending" | "live" | "done";
export type Slot = "a" | "b";

export interface Group {
  id: string;
  name: string;
  created_at?: string;
}

export interface Team {
  id: string;
  name: string;
  player1_name: string;
  player1_photo_url: string | null;
  player2_name: string;
  player2_photo_url: string | null;
  group_id: string | null;
  seed: number;
  created_at?: string;
}

export interface Match {
  id: string;
  phase: Phase;
  round: number;
  round_label: string | null;
  order_index: number;
  group_id: string | null;
  team_a_id: string | null;
  team_b_id: string | null;
  games_a: number;
  games_b: number;
  status: MatchStatus;
  winner_id: string | null;
  loser_id: string | null;
  next_match_id: string | null;
  next_match_slot: Slot | null;
  created_at?: string;
  updated_at?: string;
}

export interface TeamStats {
  team_id: string;
  team_name: string;
  group_id: string | null;
  matches_won: number;
  matches_lost: number;
  games_won: number;
  games_lost: number;
  games_diff: number;
}

export interface Settings {
  id: number;
  num_groups: number;
  qualifiers_per_group: number;
  best_of: number;
  tournament_name: string;
  bracket_generated: boolean;
}
