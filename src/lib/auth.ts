import { NextRequest } from "next/server";

// Valida a senha enviada no header contra as env vars do servidor.
// Papéis: "admin" pode tudo; "judge" pode lançar resultados.
export type Role = "admin" | "judge";

export function checkPassword(req: NextRequest, role: Role): boolean {
  const provided = req.headers.get("x-password") ?? "";
  const adminPw = process.env.ADMIN_PASSWORD ?? "";
  const judgePw = process.env.JUDGE_PASSWORD ?? "";

  if (!provided) return false;

  if (role === "admin") {
    return adminPw !== "" && provided === adminPw;
  }
  // juiz: aceita a senha de juiz OU a de admin (admin faz tudo)
  return (judgePw !== "" && provided === judgePw) || (adminPw !== "" && provided === adminPw);
}
