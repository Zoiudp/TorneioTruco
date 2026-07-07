"use client";

import { useEffect, useMemo, useState } from "react";
import type { Match, Team } from "@/lib/types";
import { teamById } from "@/lib/format";
import { DuplaCard } from "./DuplaCard";

// Carrossel rotativo dos confrontos (foco nos que estão ao vivo / a seguir).
export function MatchCarousel({
  matches,
  teams,
  intervalMs = 6000,
}: {
  matches: Match[];
  teams: Team[];
  intervalMs?: number;
}) {
  // Prioriza: ao vivo -> pendentes com as duas duplas -> demais.
  const queue = useMemo(() => {
    const relevant = matches
      .filter((m) => m.status !== "done")
      .filter((m) => m.team_a_id || m.team_b_id);
    return relevant.sort((a, b) => {
      const rank = (m: Match) => (m.status === "live" ? 0 : 1);
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      return a.order_index - b.order_index;
    });
  }, [matches]);

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (queue.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % queue.length), intervalMs);
    return () => clearInterval(t);
  }, [queue.length, intervalMs]);

  useEffect(() => {
    if (idx >= queue.length) setIdx(0);
  }, [queue.length, idx]);

  if (queue.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-2xl text-white/60">
        Nenhum confronto pendente 🎉
      </div>
    );
  }

  const m = queue[idx];
  const teamA = teamById(teams, m.team_a_id);
  const teamB = teamById(teams, m.team_b_id);

  return (
    <div key={m.id} className="animate-fade-in flex flex-col items-center gap-6">
      <div className="flex items-center gap-3">
        <span className="px-4 py-1 rounded-full bg-white/10 text-gold-400 font-bold uppercase tracking-wide">
          {m.round_label ?? (m.phase === "group" ? "Grupos" : "Mata-mata")}
        </span>
        {m.status === "live" && (
          <span className="px-3 py-1 rounded-full bg-red-500/90 text-white font-bold animate-pulse">
            AO VIVO
          </span>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 md:gap-10">
        <DuplaCard team={teamA} avatarSize={140} highlight={m.winner_id === teamA?.id} />

        <div className="flex flex-col items-center">
          <div className="text-6xl md:text-8xl font-black text-white tabular-nums">
            {m.games_a}
            <span className="text-gold-400 mx-2">×</span>
            {m.games_b}
          </div>
          <div className="text-white/50 uppercase text-sm tracking-widest mt-1">Melhor de 3</div>
        </div>

        <DuplaCard team={teamB} avatarSize={140} highlight={m.winner_id === teamB?.id} />
      </div>

      <div className="flex gap-1.5">
        {queue.map((qm, i) => (
          <span
            key={qm.id}
            className={`h-2 rounded-full transition-all ${
              i === idx ? "w-6 bg-gold-400" : "w-2 bg-white/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
