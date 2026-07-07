import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Campeonato de Truco — Família Lima 2026",
  description: "Gestão e telão do torneio de truco da família Lima.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
