import type { Group, TeamStats } from "@/lib/types";
import { rankStats } from "@/lib/tournament";

// Tabela de classificação de um grupo.
export function GroupTable({
  group,
  stats,
  qualifiers = 2,
  compact = false,
}: {
  group: Group;
  stats: TeamStats[];
  qualifiers?: number;
  compact?: boolean;
}) {
  const ranked = rankStats(stats);
  const cell = compact ? "px-2 py-1" : "px-3 py-2";

  return (
    <div className="bg-black/25 rounded-2xl overflow-hidden border border-white/10">
      <div className="bg-white/10 px-4 py-2 font-extrabold text-gold-400 uppercase tracking-wide">
        {group.name}
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-white/60 text-xs uppercase">
            <th className={`${cell} text-left`}>#</th>
            <th className={`${cell} text-left`}>Dupla</th>
            <th className={cell} title="Partidas vencidas">V</th>
            <th className={cell} title="Partidas perdidas">D</th>
            <th className={cell} title="Jogos ganhos">JG</th>
            <th className={cell} title="Jogos perdidos">JP</th>
            <th className={cell} title="Saldo de jogos">SG</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((s, i) => (
            <tr
              key={s.team_id}
              className={`border-t border-white/5 ${
                i < qualifiers ? "bg-green-500/10" : ""
              }`}
            >
              <td className={`${cell} font-bold ${i < qualifiers ? "text-green-400" : "text-white/50"}`}>
                {i + 1}
              </td>
              <td className={`${cell} text-left font-semibold`}>{s.team_name}</td>
              <td className={`${cell} text-center font-bold text-white`}>{s.matches_won}</td>
              <td className={`${cell} text-center text-white/70`}>{s.matches_lost}</td>
              <td className={`${cell} text-center text-white/70`}>{s.games_won}</td>
              <td className={`${cell} text-center text-white/70`}>{s.games_lost}</td>
              <td className={`${cell} text-center text-white/70`}>
                {s.games_diff > 0 ? `+${s.games_diff}` : s.games_diff}
              </td>
            </tr>
          ))}
          {ranked.length === 0 && (
            <tr>
              <td colSpan={7} className="px-3 py-4 text-center text-white/40">
                Sem duplas neste grupo
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
