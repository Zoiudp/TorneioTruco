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
      className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md ${
        isWinner ? "bg-gold-400/25 text-gold-400 font-bold" : "text-white/85"
      } ${done && !isWinner ? "opacity-45" : ""}`}
    >
      <span className="truncate text-sm">{team ? team.name : "A definir"}</span>
      <span className="tabular-nums font-bold text-sm shrink-0">{team ? score : "–"}</span>
    </div>
  );
}

// Chave do mata-mata em formato de árvore (colunas por rodada + conectores),
// com as rodadas seguintes centralizadas entre seus confrontos de origem.
export function BracketView({ matches, teams }: { matches: Match[]; teams: Team[] }) {
  const knockout = matches.filter((m) => m.phase === "knockout");
  if (knockout.length === 0) {
    return <div className="text-white/50 text-center py-6">Chave ainda não gerada.</div>;
  }

  const rounds = Array.from(new Set(knockout.map((m) => m.round))).sort((a, b) => a - b);

  return (
    <div className="bracket-scroll overflow-x-auto pb-4">
      <div className="bracket">
        {rounds.map((round, ri) => {
          const roundMatches = knockout
            .filter((m) => m.round === round)
            .sort((a, b) => a.order_index - b.order_index);
          const label = roundMatches[0]?.round_label ?? `Rodada ${round}`;
          const isLast = ri === rounds.length - 1;
          return (
            <div key={round} className="round">
              <div className="round-title">{label}</div>
              <div className="round-body">
                {roundMatches.map((m, mi) => {
                  const a = teamById(teams, m.team_a_id);
                  const b = teamById(teams, m.team_b_id);
                  const done = m.status === "done";
                  const showVertical = !isLast && mi % 2 === 0; // topo de cada par
                  return (
                    <div
                      key={m.id}
                      className={`match-item ${isLast ? "is-last" : ""} ${ri > 0 ? "has-entry" : ""}`}
                    >
                      {showVertical && <span className="connector-v" />}
                      <div className="match-card">
                        <Side team={a} score={m.games_a} isWinner={done && m.winner_id === a?.id} done={done} />
                        <div className="border-t border-white/10" />
                        <Side team={b} score={m.games_b} isWinner={done && m.winner_id === b?.id} done={done} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .bracket { display: flex; align-items: stretch; min-height: 100%; }
        .round { display: flex; flex-direction: column; min-width: 190px; }
        .round-title {
          text-align: center; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.05em; font-size: 0.72rem; color: #f5c542; margin-bottom: 8px;
        }
        .round-body { display: flex; flex-direction: column; justify-content: space-around; flex: 1 1 auto; }
        .match-item {
          position: relative; display: flex; align-items: center;
          flex: 1 1 0; padding: 6px 22px 6px 0;
        }
        .match-card {
          width: 100%; background: rgba(0,0,0,0.32);
          border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 6px;
        }
        /* linha horizontal saindo de cada confronto (menos na final) */
        .round:not(:last-child) .match-item::after {
          content: ""; position: absolute; top: 50%; left: calc(100% - 22px);
          width: 22px; height: 2px; background: rgba(245,197,66,0.45);
        }
        /* linha vertical unindo o par de confrontos que alimentam o próximo */
        .connector-v {
          position: absolute; top: 50%; left: 100%;
          width: 2px; height: 100%; background: rgba(245,197,66,0.45);
        }
        /* linha horizontal entrando no confronto da rodada seguinte */
        .match-item.has-entry::before {
          content: ""; position: absolute; top: 50%; right: 100%;
          width: 22px; height: 2px; background: rgba(245,197,66,0.45);
        }
        .match-item.is-last { padding-right: 0; }
      `}</style>
    </div>
  );
}
