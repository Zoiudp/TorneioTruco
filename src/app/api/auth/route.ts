import { NextRequest, NextResponse } from "next/server";
import { checkPassword, type Role } from "@/lib/auth";

export const runtime = "nodejs";

// Valida a senha informada para um papel ("admin" | "judge").
// Usado pela tela de acesso para dar retorno imediato ao usuário.
export async function POST(req: NextRequest) {
  const role = (new URL(req.url).searchParams.get("role") as Role) ?? "judge";
  const adminSet = !!process.env.ADMIN_PASSWORD;
  const judgeSet = !!process.env.JUDGE_PASSWORD;

  if (checkPassword(req, role)) {
    return NextResponse.json({ ok: true });
  }
  // Ajuda a diagnosticar configuração ausente no servidor (ex.: Vercel).
  return NextResponse.json(
    {
      ok: false,
      error: "Senha incorreta",
      server_config: { admin_password_set: adminSet, judge_password_set: judgeSet },
    },
    { status: 401 }
  );
}
