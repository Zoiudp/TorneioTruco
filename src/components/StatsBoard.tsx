import type { TeamStats } from "@/lib/types";

// Ranking geral de estatísticas (jogos e partidas ganhos/perdidos).
export function StatsBoard({ stats, compact = false }: { stats: TeamStats[]; compact?: boolean }) {
  const ranked = [...stats].sort((a, b) => {
    if (b.matches_won !== a.matches_won) return b.matches_won - a.matches_won;
    if (b.games_diff !== a.games_diff) return b.games_diff - a.games_diff;
    return b.games_won - a.games_won;
  });
  const cell = compact ? "px-2 py-1" : "px-3 py-2";

  return (
    <div className="bg-black/25 rounded-2xl overflow-hidden border border-white/10">
      <div className="bg-white/10 px-4 py-2 font-extrabold text-gold-400 uppercase tracking-wide">
        Estatísticas — Tempo Real
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-white/60 text-xs uppercase">
            <th className={`${cell} text-left`}>Dupla</th>
            <th className={cell} title="Partidas ganhas / perdidas">Partidas</th>
            <th className={cell} title="Jogos ganhos">Jogos G</th>
            <th className={cell} title="Jogos perdidos">Jogos P</th>
            <th className={cell} title="Saldo">Saldo</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((s) => (
            <tr key={s.team_id} className="border-t border-white/5">
              <td className={`${cell} text-left font-semibold`}>{s.team_name}</td>
              <td className={`${cell} text-center font-bold text-white`}>
                <span className="text-green-400">{s.matches_won}</span>
                <span className="text-white/40"> / </span>
                <span className="text-red-400">{s.matches_lost}</span>
              </td>
              <td className={`${cell} text-center text-white/80`}>{s.games_won}</td>
              <td className={`${cell} text-center text-white/80`}>{s.games_lost}</td>
              <td className={`${cell} text-center font-bold ${s.games_diff >= 0 ? "text-green-400" : "text-red-400"}`}>
                {s.games_diff > 0 ? `+${s.games_diff}` : s.games_diff}
              </td>
            </tr>
          ))}
          {ranked.length === 0 && (
            <tr>
              <td colSpan={5} className="px-3 py-4 text-center text-white/40">
                Sem estatísticas ainda
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
