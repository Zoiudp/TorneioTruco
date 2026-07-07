import { NextRequest, NextResponse } from "next/server";
import { checkPassword } from "@/lib/auth";
import { supabaseAdmin, supabaseServerRead } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Lista todas as duplas (público).
export async function GET() {
  const db = supabaseServerRead();
  const { data, error } = await db.from("teams").select("*").order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ teams: data });
}

// Cria uma dupla (admin).
export async function POST(req: NextRequest) {
  if (!checkPassword(req, "admin")) {
    return NextResponse.json({ error: "Senha inválida" }, { status: 401 });
  }
  const body = await req.json();
  const { name, player1_name, player1_photo_url, player2_name, player2_photo_url } = body;

  if (!name || !player1_name || !player2_name) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("teams")
    .insert({
      name,
      player1_name,
      player1_photo_url: player1_photo_url ?? null,
      player2_name,
      player2_photo_url: player2_photo_url ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ team: data });
}

// Atualiza uma dupla (admin).
export async function PUT(req: NextRequest) {
  if (!checkPassword(req, "admin")) {
    return NextResponse.json({ error: "Senha inválida" }, { status: 401 });
  }
  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const admin = supabaseAdmin();
  const { data, error } = await admin.from("teams").update(fields).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ team: data });
}

// Remove uma dupla (admin).
export async function DELETE(req: NextRequest) {
  if (!checkPassword(req, "admin")) {
    return NextResponse.json({ error: "Senha inválida" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const admin = supabaseAdmin();
  const { error } = await admin.from("teams").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
