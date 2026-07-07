import type { Team } from "@/lib/types";
import { PlayerAvatar } from "./PlayerAvatar";

// Imagem composta da dupla: as duas fotos dos membros + nomes + nome da dupla.
export function DuplaCard({
  team,
  avatarSize = 96,
  highlight = false,
}: {
  team: Team | undefined;
  avatarSize?: number;
  highlight?: boolean;
}) {
  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center opacity-60 py-4">
        <div
          style={{ width: avatarSize, height: avatarSize }}
          className="rounded-full border-2 border-dashed border-white/30 flex items-center justify-center text-white/40 text-3xl"
        >
          ?
        </div>
        <span className="mt-2 text-white/50 font-semibold">A definir</span>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center text-center rounded-2xl px-4 py-3 transition ${
        highlight ? "bg-gold-400/15 ring-2 ring-gold-400" : ""
      }`}
    >
      <div className="flex items-center -space-x-3">
        <PlayerAvatar name={team.player1_name} photoUrl={team.player1_photo_url} size={avatarSize} />
        <PlayerAvatar name={team.player2_name} photoUrl={team.player2_photo_url} size={avatarSize} />
      </div>
      <div className="mt-2 font-extrabold text-gold-400 leading-tight" style={{ fontSize: avatarSize * 0.24 }}>
        {team.name}
      </div>
      <div className="text-white/80 leading-tight" style={{ fontSize: avatarSize * 0.16 }}>
        {team.player1_name} &amp; {team.player2_name}
      </div>
    </div>
  );
}
