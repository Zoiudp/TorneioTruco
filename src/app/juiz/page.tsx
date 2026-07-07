"use client";

import { useState } from "react";
import Link from "next/link";
import { PasswordGate } from "@/components/PasswordGate";
import { useTournamentData } from "@/lib/useTournamentData";
import { teamById } from "@/lib/format";
import type { Match } from "@/lib/types";

function JudgePanel({ password, logout }: { password: string; logout: () => void }) {
  const { teams, matches, loading, refetch } = useTournamentData();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const playable = matches
    .filter((m) => m.status !== "done" && m.team_a_id && m.team_b_id)
    .sort((a, b) => {
      const rank = (m: Match) => (m.status === "live" ? 0 : 1);
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      return a.order_index - b.order_index;
    });

  async function reportGame(matchId: string, winnerSlot: "a" | "b") {
    setBusy(matchId);
    setError(null);
    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-password": password },
        body: JSON.stringify({ action: "game", matchId, winnerSlot }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erro ao registrar");
        if (res.status === 401) logout();
      }
      refetch();
    } catch {
      setError("Falha de conexão");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="min-h-screen max-w-2xl mx-auto p-4">
      <header className="flex items-center justify-between py-2 mb-4">
        <h1 className="text-2xl font-black text-gold-400">⚖️ Painel do Juiz</h1>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/" className="text-white/50 hover:text-white">Início</Link>
          <button onClick={logout} className="text-white/50 hover:text-white">Sair</button>
        </div>
      </header>

      {error && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-200 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-white/50 text-center py-12">Carregando…</p>
      ) : playable.length === 0 ? (
        <p className="text-white/50 text-center py-12">
          Nenhuma partida disponível para lançar.
        </p>
      ) : (
        <div className="space-y-4">
          {playable.map((m) => {
            const a = teamById(teams, m.team_a_id);
            const b = teamById(teams, m.team_b_id);
            const isBusy = busy === m.id;
            return (
              <div key={m.id} className="bg-black/30 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs uppercase tracking-wide text-white/50">
                    {m.round_label}
                  </span>
                  {m.status === "live" && (
                    <span className="text-xs font-bold text-red-400">EM ANDAMENTO</span>
                  )}
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <button
                    disabled={isBusy}
                    onClick={() => reportGame(m.id, "a")}
                    className="rounded-xl bg-felt-700 hover:bg-green-600 disabled:opacity-50 transition p-3 text-center"
                  >
                    <div className="font-extrabold text-white">{a?.name}</div>
                    <div className="text-xs text-white/60 mt-1">Marcar jogo ✔</div>
                  </button>

                  <div className="text-3xl font-black tabular-nums text-white text-center">
                    {m.games_a}<span className="text-gold-400 mx-1">×</span>{m.games_b}
                  </div>

                  <button
                    disabled={isBusy}
                    onClick={() => reportGame(m.id, "b")}
                    className="rounded-xl bg-felt-700 hover:bg-green-600 disabled:opacity-50 transition p-3 text-center"
                  >
                    <div className="font-extrabold text-white">{b?.name}</div>
                    <div className="text-xs text-white/60 mt-1">Marcar jogo ✔</div>
                  </button>
                </div>
                <p className="text-center text-white/40 text-xs mt-3">
                  Melhor de 3 — 2 jogos vencem a partida.
                </p>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default function JuizPage() {
  return (
    <PasswordGate storageKey="truco-judge-pw" title="⚖️ Acesso do Juiz">
      {(password, logout) => <JudgePanel password={password} logout={logout} />}
    </PasswordGate>
  );
}
