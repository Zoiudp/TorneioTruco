"use client";

import { useEffect, useMemo, useState } from "react";
import type { Match, Team } from "@/lib/types";
import { teamById } from "@/lib/format";
import { DuplaCard } from "./DuplaCard";

// Tamanho do avatar conforme a largura da tela (evita estouro no celular).
function useAvatarSize() {
  const [size, setSize] = useState(96);
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      if (w < 380) setSize(58);
      else if (w < 640) setSize(74);
      else if (w < 1024) setSize(110);
      else setSize(140);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);
  return size;
}

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
  const avatarSize = useAvatarSize();

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
    <div key={m.id} className="animate-fade-in flex flex-col items-center gap-4 sm:gap-6 w-full">
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
        <span className="px-3 sm:px-4 py-1 rounded-full bg-white/10 text-gold-400 font-bold uppercase tracking-wide text-sm sm:text-base text-center">
          {m.round_label ?? (m.phase === "group" ? "Grupos" : "Mata-mata")}
        </span>
        {m.status === "live" && (
          <span className="px-3 py-1 rounded-full bg-red-500/90 text-white font-bold animate-pulse text-sm sm:text-base">
            AO VIVO
          </span>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 sm:gap-6 md:gap-10 w-full max-w-full">
        <DuplaCard team={teamA} avatarSize={avatarSize} highlight={m.winner_id === teamA?.id} />

        <div className="flex flex-col items-center shrink-0">
          <div className="text-4xl sm:text-6xl md:text-8xl font-black text-white tabular-nums">
            {m.games_a}
            <span className="text-gold-400 mx-1 sm:mx-2">×</span>
            {m.games_b}
          </div>
          <div className="text-white/50 uppercase text-[10px] sm:text-sm tracking-widest mt-1">Melhor de 3</div>
        </div>

        <DuplaCard team={teamB} avatarSize={avatarSize} highlight={m.winner_id === teamB?.id} />
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
