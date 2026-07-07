import Link from "next/link";

const cards = [
  { href: "/telao", emoji: "📺", title: "Telão", desc: "Confrontos, chaves e estatísticas ao vivo" },
  { href: "/publico", emoji: "📱", title: "Público", desc: "Acompanhe pelo celular" },
  { href: "/juiz", emoji: "⚖️", title: "Juiz", desc: "Lançar resultados das partidas" },
];

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-10">
      <div className="text-center">
        <div className="text-6xl mb-3">🃏</div>
        <h1 className="text-3xl md:text-5xl font-black text-gold-400">
          Campeonato de Truco
        </h1>
        <p className="text-xl md:text-2xl text-white/80 mt-1">Família Lima 2026</p>
      </div>

      <div className="grid gap-4 w-full max-w-3xl md:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="bg-black/30 border border-white/10 rounded-2xl p-6 text-center hover:bg-black/40 hover:border-gold-400/60 transition"
          >
            <div className="text-4xl mb-2">{c.emoji}</div>
            <div className="text-xl font-extrabold text-gold-400">{c.title}</div>
            <div className="text-white/60 text-sm mt-1">{c.desc}</div>
          </Link>
        ))}
      </div>

      <Link href="/admin" className="text-white/40 text-sm hover:text-white/80 transition">
        Acesso do organizador (admin)
      </Link>
    </main>
  );
}
