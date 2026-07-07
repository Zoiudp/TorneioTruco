"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTournamentData } from "@/lib/useTournamentData";
import { MatchCarousel } from "@/components/MatchCarousel";
import { GroupTable } from "@/components/GroupTable";
import { BracketView } from "@/components/BracketView";
import { StatsBoard } from "@/components/StatsBoard";

type Scene = "confrontos" | "grupos" | "chave" | "estatisticas";

const SCENE_MS = 14000;

export default function Telao() {
  const { teams, matches, groups, stats, settings, loading } = useTournamentData();
  const hasKnockout = matches.some((m) => m.phase === "knockout");

  const scenes = useMemo<Scene[]>(() => {
    const s: Scene[] = ["confrontos", "grupos"];
    if (hasKnockout) s.push("chave");
    s.push("estatisticas");
    return s;
  }, [hasKnockout]);

  const [sceneIdx, setSceneIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSceneIdx((i) => (i + 1) % scenes.length), SCENE_MS);
    return () => clearInterval(t);
  }, [scenes.length]);
  useEffect(() => {
    if (sceneIdx >= scenes.length) setSceneIdx(0);
  }, [scenes.length, sceneIdx]);

  const scene = scenes[sceneIdx];
  const qpg = settings?.qualifiers_per_group ?? 2;

  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🃏</span>
          <h1 className="text-xl md:text-2xl font-black text-gold-400 leading-tight">
            {settings?.tournament_name ?? "Campeonato de Truco — Família Lima 2026"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {scenes.map((s, i) => (
            <button
              key={s}
              onClick={() => setSceneIdx(i)}
              className={`px-3 py-1 rounded-full text-xs uppercase font-bold tracking-wide transition ${
                i === sceneIdx ? "bg-gold-400 text-felt-900" : "bg-white/10 text-white/60"
              }`}
            >
              {s}
            </button>
          ))}
          <Link href="/" className="ml-2 text-white/40 hover:text-white text-sm">✕</Link>
        </div>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center p-6 overflow-auto">
        {loading ? (
          <div className="text-white/50 text-2xl">Carregando…</div>
        ) : scene === "confrontos" ? (
          <MatchCarousel matches={matches} teams={teams} />
        ) : scene === "grupos" ? (
          <div className="w-full max-w-6xl grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {groups.map((g) => (
              <GroupTable
                key={g.id}
                group={g}
                qualifiers={qpg}
                stats={stats.filter((s) => s.group_id === g.id)}
              />
            ))}
            {groups.length === 0 && (
              <div className="text-white/50 text-xl col-span-full text-center">
                Aguardando geração da fase de grupos…
              </div>
            )}
          </div>
        ) : scene === "chave" ? (
          <div className="w-full max-w-6xl">
            <h2 className="text-2xl font-black text-gold-400 mb-4 text-center">Mata-mata</h2>
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
