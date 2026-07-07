"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "./supabase/client";
import type { Group, Match, Settings, Team, TeamStats } from "./types";

export interface TournamentData {
  teams: Team[];
  matches: Match[];
  groups: Group[];
  stats: TeamStats[];
  settings: Settings | null;
  loading: boolean;
  refetch: () => void;
}

// Carrega todos os dados do torneio e assina o Realtime do Supabase.
// Qualquer mudança em `matches`/`teams`/`groups` dispara um refetch — é assim
// que o telão e a visão pública se atualizam sozinhos ao fim de cada partida.
export function useTournamentData(): TournamentData {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [stats, setStats] = useState<TeamStats[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [t, m, g, s, cfg] = await Promise.all([
      supabaseBrowser.from("teams").select("*").order("created_at"),
      supabaseBrowser.from("matches").select("*").order("order_index"),
      supabaseBrowser.from("groups").select("*").order("name"),
      supabaseBrowser.from("team_stats").select("*"),
      supabaseBrowser.from("settings").select("*").eq("id", 1).single(),
    ]);
    if (t.data) setTeams(t.data as Team[]);
    if (m.data) setMatches(m.data as Match[]);
    if (g.data) setGroups(g.data as Group[]);
    if (s.data) setStats(s.data as TeamStats[]);
    if (cfg.data) setSettings(cfg.data as Settings);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();

    const channel = supabaseBrowser
      .channel("tournament-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "groups" }, fetchAll)
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [fetchAll]);

  return { teams, matches, groups, stats, settings, loading, refetch: fetchAll };
}
