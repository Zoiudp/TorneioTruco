import { NextRequest, NextResponse } from "next/server";
import { checkPassword } from "@/lib/auth";
import { supabaseAdmin, supabaseServerRead } from "@/lib/supabase/server";
import { applyGameWin } from "@/lib/tournament";
import type { Match, Settings } from "@/lib/types";

export const runtime = "nodejs";

// Lista as partidas (público).
export async function GET() {
  const db = supabaseServerRead();
  const { data, error } = await db.from("matches").select("*").order("order_index");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ matches: data });
}

// Lança o resultado de um jogo (juiz) ou corrige/reseta uma partida (admin).
//
// Body:
//   { action: "game", matchId, winnerSlot: "a" | "b" }   -> juiz
//   { action: "reset", matchId }                          -> admin
export async function POST(req: NextRequest) {
  const body = await req.json();
  const action = body.action ?? "game";

  const admin = supabaseAdmin();

  if (action === "reset") {
    if (!checkPassword(req, "admin")) {
      return NextResponse.json({ error: "Senha de admin inválida" }, { status: 401 });
    }
    const { error } = await admin
      .from("matches")
      .update({ games_a: 0, games_b: 0, status: "pending", winner_id: null, loser_id: null })
      .eq("id", body.matchId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // action === "game" (juiz)
  if (!checkPassword(req, "judge")) {
    return NextResponse.json({ error: "Senha inválida" }, { status: 401 });
  }
  const { matchId, winnerSlot } = body;
  if (!matchId || (winnerSlot !== "a" && winnerSlot !== "b")) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  const { data: match, error: mErr } = await admin
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single<Match>();
  if (mErr || !match) {
    return NextResponse.json({ error: "Partida não encontrada" }, { status: 404 });
  }
  if (match.status === "done") {
    return NextResponse.json({ error: "Partida já encerrada" }, { status: 409 });
  }

  const { data: settings } = await admin
    .from("settings")
    .select("*")
    .eq("id", 1)
    .single<Settings>();
  const bestOf = settings?.best_of ?? 3;

  const next = applyGameWin(match, winnerSlot, bestOf);

  const { error: uErr } = await admin
    .from("matches")
    .update({
      games_a: next.games_a,
      games_b: next.games_b,
      status: next.status,
      winner_id: next.winner_id,
      loser_id: next.loser_id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", matchId);
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

  // Propaga o vencedor para o próximo confronto do mata-mata.
  if (next.status === "done" && next.winner_id && match.next_match_id && match.next_match_slot) {
    const col = match.next_match_slot === "a" ? "team_a_id" : "team_b_id";
    await admin
      .from("matches")
      .update({ [col]: next.winner_id })
      .eq("id", match.next_match_id);
  }

  return NextResponse.json({ ok: true, match: { ...match, ...next } });
}
