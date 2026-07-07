import { NextRequest, NextResponse } from "next/server";
import { checkPassword } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  distributeIntoGroups,
  generateGroupMatches,
  generateBracket,
  seedQualifiers,
} from "@/lib/tournament";
import type { Team, TeamStats } from "@/lib/types";

export const runtime = "nodejs";

// Ações de configuração / geração da chave (somente admin).
//
// Body:
//   { action: "update-settings", num_groups, qualifiers_per_group, best_of, tournament_name }
//   { action: "generate-groups" }        -> distribui times e cria rodízio
//   { action: "generate-knockout" }      -> gera o mata-mata a partir da classificação
//   { action: "reset-all" }              -> apaga partidas e grupos
export async function POST(req: NextRequest) {
  if (!checkPassword(req, "admin")) {
    return NextResponse.json({ error: "Senha de admin inválida" }, { status: 401 });
  }

  const admin = supabaseAdmin();
  const body = await req.json();
  const action = body.action as string;

  if (action === "update-settings") {
    const patch: Record<string, unknown> = {};
    for (const k of ["num_groups", "qualifiers_per_group", "best_of", "tournament_name"]) {
      if (body[k] !== undefined) patch[k] = body[k];
    }
    const { error } = await admin.from("settings").update(patch).eq("id", 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "reset-all") {
    await admin.from("matches").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await admin.from("teams").update({ group_id: null, seed: 0 }).neq("id", "00000000-0000-0000-0000-000000000000");
    await admin.from("groups").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await admin.from("settings").update({ bracket_generated: false }).eq("id", 1);
    return NextResponse.json({ ok: true });
  }

  if (action === "generate-groups") {
    // Lê config e times
    const { data: settings } = await admin.from("settings").select("*").eq("id", 1).single();
    const numGroups = Math.max(1, settings?.num_groups ?? 2);
    const { data: teams } = await admin.from("teams").select("*");
    if (!teams || teams.length < 2) {
      return NextResponse.json({ error: "Cadastre ao menos 2 duplas" }, { status: 400 });
    }

    // Limpa estado anterior
    await admin.from("matches").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await admin.from("groups").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Cria grupos
    const groupRows = Array.from({ length: numGroups }, (_, i) => ({
      name: `Grupo ${String.fromCharCode(65 + i)}`,
    }));
    const { data: groups, error: gErr } = await admin.from("groups").insert(groupRows).select();
    if (gErr || !groups) {
      return NextResponse.json({ error: gErr?.message ?? "Falha ao criar grupos" }, { status: 500 });
    }

    // Distribui os times nos grupos
    const distribution = distributeIntoGroups(
      (teams as Team[]).map((t) => t.id),
      numGroups
    );

    // Atualiza group_id dos times e gera confrontos por grupo
    let order = 0;
    const allMatches = [];
    for (let g = 0; g < numGroups; g++) {
      const groupId = groups[g].id;
      const teamIds = distribution[g];
      for (const teamId of teamIds) {
        await admin.from("teams").update({ group_id: groupId }).eq("id", teamId);
      }
      const matches = generateGroupMatches(groupId, teamIds, order);
      order += matches.length;
      allMatches.push(...matches);
    }

    if (allMatches.length > 0) {
      const { error: insErr } = await admin.from("matches").insert(allMatches);
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    }
    await admin.from("settings").update({ bracket_generated: false }).eq("id", 1);
    return NextResponse.json({ ok: true, groups: groups.length, matches: allMatches.length });
  }

  if (action === "generate-knockout") {
    const { data: settings } = await admin.from("settings").select("*").eq("id", 1).single();
    const qpg = Math.max(1, settings?.qualifiers_per_group ?? 2);

    // Estatísticas atuais por grupo
    const { data: stats } = await admin.from("team_stats").select("*");
    const { data: groups } = await admin.from("groups").select("*");
    if (!stats || !groups || groups.length === 0) {
      return NextResponse.json({ error: "Gere a fase de grupos primeiro" }, { status: 400 });
    }

    const statsByGroup: Record<string, TeamStats[]> = {};
    for (const g of groups) statsByGroup[g.id] = [];
    for (const s of stats as TeamStats[]) {
      if (s.group_id && statsByGroup[s.group_id]) statsByGroup[s.group_id].push(s);
    }

    const ordered = seedQualifiers(statsByGroup, qpg);
    if (ordered.length < 2) {
      return NextResponse.json({ error: "Classificados insuficientes" }, { status: 400 });
    }

    // Remove qualquer mata-mata anterior (mantém as partidas de grupo)
    await admin.from("matches").delete().eq("phase", "knockout");

    // order_index do mata-mata começa após as partidas de grupo
    const { count } = await admin
      .from("matches")
      .select("*", { count: "exact", head: true })
      .eq("phase", "group");
    const startOrder = (count ?? 0) + 1000;

    const bracket = generateBracket(ordered, startOrder);
    // grava seeds nos times classificados (para exibição)
    for (let i = 0; i < ordered.length; i++) {
      await admin.from("teams").update({ seed: i + 1 }).eq("id", ordered[i]);
    }

    const { error: insErr } = await admin.from("matches").insert(bracket);
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

    await admin.from("settings").update({ bracket_generated: true }).eq("id", 1);
    return NextResponse.json({ ok: true, matches: bracket.length, qualifiers: ordered.length });
  }

  return NextResponse.json({ error: "Ação desconhecida" }, { status: 400 });
}
