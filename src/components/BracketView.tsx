import type { Match, Team } from "@/lib/types";
import { teamById } from "@/lib/format";

function Side({
  team,
  score,
  isWinner,
  done,
}: {
  team: Team | undefined;
  score: number;
  isWinner: boolean;
  done: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg ${
        isWinner ? "bg-gold-400/20 text-gold-400 font-bold" : "text-white/80"
      } ${done && !isWinner ? "opacity-50" : ""}`}
    >
      <span className="truncate">{team ? team.name : "A definir"}</span>
      <span className="tabular-nums font-bold">{team ? score : "–"}</span>
    </div>
  );
}

// Chave do mata-mata em colunas (uma por rodada).
export function BracketView({ matches, teams }: { matches: Match[]; teams: Team[] }) {
  const knockout = matches.filter((m) => m.phase === "knockout");
  if (knockout.length === 0) {
    return <div className="text-white/50 text-center py-6">Mata-mata ainda não gerado.</div>;
  }

  const rounds = Array.from(new Set(knockout.map((m) => m.round))).sort((a, b) => a - b);

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {rounds.map((round) => {
        const roundMatches = knockout
          .filter((m) => m.round === round)
          .sort((a, b) => a.order_index - b.order_index);
        const label = roundMatches[0]?.round_label ?? `Rodada ${round}`;
        return (
          <div key={round} className="flex flex-col justify-around gap-4 min-w-[220px]">
            <div className="text-center font-extrabold text-gold-400 uppercase tracking-wide text-sm">
              {label}
            </div>
            {roundMatches.map((m) => {
              const a = teamById(teams, m.team_a_id);
              const b = teamById(teams, m.team_b_id);
              const done = m.status === "done";
              return (
                <div
                  key={m.id}
                  className="bg-black/30 border border-white/10 rounded-xl p-2 space-y-1"
                >
                  <Side team={a} score={m.games_a} isWinner={done && m.winner_id === a?.id} done={done} />
                  <div className="border-t border-white/10" />
                  <Side team={b} score={m.games_b} isWinner={done && m.winner_id === b?.id} done={done} />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
