import { initials } from "@/lib/format";

// Foto do jogador (ou iniciais se não houver foto).
export function PlayerAvatar({
  name,
  photoUrl,
  size = 96,
}: {
  name: string;
  photoUrl: string | null;
  size?: number;
}) {
  const dim = { width: size, height: size };
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={photoUrl}
        alt={name}
        style={dim}
        className="rounded-full object-cover border-2 border-gold-400/70 bg-felt-800"
      />
    );
  }
  return (
    <div
      style={dim}
      className="rounded-full border-2 border-gold-400/70 bg-felt-700 flex items-center justify-center font-bold text-gold-400"
    >
      <span style={{ fontSize: size * 0.32 }}>{initials(name)}</span>
    </div>
  );
}
