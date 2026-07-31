"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTournamentData } from "@/lib/useTournamentData";
import { MatchCarousel } from "@/components/MatchCarousel";
import { BracketView } from "@/components/BracketView";
import { StatsBoard } from "@/components/StatsBoard";

type Scene = "confrontos" | "chave" | "estatisticas";

const SCENE_MS = 14000;

export default function Telao() {
  const { teams, matches, stats, settings, loading } = useTournamentData();
  const hasBracket = matches.some((m) => m.phase === "knockout");

  const scenes = useMemo<Scene[]>(() => {
    const s: Scene[] = ["confrontos"];
    if (hasBracket) s.push("chave");
    s.push("estatisticas");
    return s;
  }, [hasBracket]);

  const [sceneIdx, setSceneIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSceneIdx((i) => (i + 1) % scenes.length), SCENE_MS);
    return () => clearInterval(t);
  }, [scenes.length]);
  useEffect(() => {
    if (sceneIdx >= scenes.length) setSceneIdx(0);
  }, [scenes.length, sceneIdx]);

  const scene = scenes[sceneIdx];

  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between gap-2 px-3 sm:px-6 py-3 border-b border-white/10 flex-wrap">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="text-2xl sm:text-3xl">🃏</span>
          <h1 className="text-base sm:text-xl md:text-2xl font-black text-gold-400 leading-tight truncate">
            {settings?.tournament_name ?? "Campeonato de Truco — Família Lima 2026"}
          </h1>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-full">
          {scenes.map((s, i) => (
            <button
              key={s}
              onClick={() => setSceneIdx(i)}
              className={`shrink-0 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs uppercase font-bold tracking-wide transition ${
                i === sceneIdx ? "bg-gold-400 text-felt-900" : "bg-white/10 text-white/60"
              }`}
            >
              {s}
            </button>
          ))}
          <Link href="/" className="shrink-0 ml-1 sm:ml-2 text-white/40 hover:text-white text-sm">✕</Link>
        </div>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center p-6 overflow-auto">
        {loading ? (
          <div className="text-white/50 text-2xl">Carregando…</div>
        ) : scene === "confrontos" ? (
          <MatchCarousel matches={matches} teams={teams} />
        ) : scene === "chave" ? (
          <div className="w-full max-w-6xl">
            <h2 className="text-2xl font-black text-gold-400 mb-4 text-center">Chaveamento — Mata-mata</h2>
            <BracketView matches={matches} teams={teams} />
          </div>
        ) : (
          <div className="w-full max-w-4xl">
            <StatsBoard stats={stats} />
          </div>
        )}
      </section>
    </main>
  );
}
