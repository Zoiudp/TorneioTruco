import { NextRequest, NextResponse } from "next/server";
import { checkPassword } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { generateBracket, shuffle } from "@/lib/tournament";
import type { Team } from "@/lib/types";

export const runtime = "nodejs";

const ZERO = "00000000-0000-0000-0000-000000000000";

// Ações de configuração / geração da chave (somente admin).
//
// Body:
//   { action: "update-settings", best_of, tournament_name }
//   { action: "generate-bracket" }  -> gera o mata-mata direto com todas as duplas
//   { action: "reset-all" }         -> apaga partidas e zera sementes
export async function POST(req: NextRequest) {
  if (!checkPassword(req, "admin")) {
    return NextResponse.json({ error: "Senha de admin inválida" }, { status: 401 });
  }

  const admin = supabaseAdmin();
  const body = await req.json();
  const action = body.action as string;

  if (action === "update-settings") {
    const patch: Record<string, unknown> = {};
    for (const k of ["best_of", "tournament_name"]) {
      if (body[k] !== undefined) patch[k] = body[k];
    }
    const { error } = await admin.from("settings").update(patch).eq("id", 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "reset-all") {
    await admin.from("matches").delete().neq("id", ZERO);
    await admin.from("teams").update({ group_id: null, seed: 0 }).neq("id", ZERO);
    await admin.from("groups").delete().neq("id", ZERO);
    await admin.from("settings").update({ bracket_generated: false }).eq("id", 1);
    return NextResponse.json({ ok: true });
  }

  if (action === "generate-bracket") {
    const { data: teams } = await admin.from("teams").select("*");
    if (!teams || teams.length < 2) {
      return NextResponse.json({ error: "Cadastre ao menos 2 duplas" }, { status: 400 });
    }

    // Sorteio das duplas (chaveamento aleatório) e limpeza de partidas anteriores.
    const ordered = shuffle((teams as Team[]).map((t) => t.id));
    await admin.from("matches").delete().neq("id", ZERO);

    const bracket = generateBracket(ordered, 1);

    // Grava a semente (posição no sorteio) de cada dupla, para exibição.
    for (let i = 0; i < ordered.length; i++) {
      await admin.from("teams").update({ seed: i + 1 }).eq("id", ordered[i]);
    }

    const { error: insErr } = await admin.from("matches").insert(bracket);
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

    await admin.from("settings").update({ bracket_generated: true }).eq("id", 1);
    return NextResponse.json({ ok: true, matches: bracket.length, teams: ordered.length });
  }

  return NextResponse.json({ error: "Ação desconhecida" }, { status: 400 });
}
