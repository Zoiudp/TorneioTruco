"use client";

import Link from "next/link";
import { useTournamentData } from "@/lib/useTournamentData";
import { MatchCarousel } from "@/components/MatchCarousel";
import { GroupTable } from "@/components/GroupTable";
import { BracketView } from "@/components/BracketView";
import { StatsBoard } from "@/components/StatsBoard";

export default function Publico() {
  const { teams, matches, groups, stats, settings, loading } = useTournamentData();
  const hasKnockout = matches.some((m) => m.phase === "knockout");
  const qpg = settings?.qualifiers_per_group ?? 2;

  return (
    <main className="min-h-screen max-w-3xl mx-auto p-4 space-y-8">
      <header className="text-center pt-2">
        <div className="text-4xl">🃏</div>
        <h1 className="text-2xl font-black text-gold-400">
          {settings?.tournament_name ?? "Campeonato de Truco — Família Lima 2026"}
        </h1>
        <Link href="/" className="text-white/40 text-sm hover:text-white">← Início</Link>
      </header>

      {loading ? (
        <div className="text-center text-white/50 py-12">Carregando…</div>
      ) : (
        <>
          <section>
            <h2 className="text-lg font-extrabold text-gold-400 uppercase tracking-wide mb-3">
              Confrontos
            </h2>
            <div className="bg-black/20 rounded-2xl p-4 border border-white/10 min-h-[280px] flex items-center justify-center">
              <MatchCarousel matches={matches} teams={teams} />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-gold-400 uppercase tracking-wide mb-3">
              Grupos
            </h2>
            <div className="space-y-4">
              {groups.map((g) => (
                <GroupTable
                  key={g.id}
                  group={g}
                  qualifiers={qpg}
                  compact
                  stats={stats.filter((s) => s.group_id === g.id)}
                />
              ))}
              {groups.length === 0 && (
                <p className="text-white/50 text-center py-4">Fase de grupos ainda não gerada.</p>
              )}
            </div>
          </section>

          {hasKnockout && (
            <section>
              <h2 className="text-lg font-extrabold text-gold-400 uppercase tracking-wide mb-3">
                Mata-mata
              </h2>
              <BracketView matches={matches} teams={teams} />
            </section>
          )}

          <section>
            <h2 className="text-lg font-extrabold text-gold-400 uppercase tracking-wide mb-3">
              Estatísticas
            </h2>
            <StatsBoard stats={stats} compact />
          </section>
        </>
      )}
    </main>
  );
}
