import { NextRequest, NextResponse } from "next/server";
import { checkPassword } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Upload de foto de jogador para o bucket "team-photos" (somente admin).
export async function POST(req: NextRequest) {
  if (!checkPassword(req, "admin")) {
    return NextResponse.json({ error: "Senha inválida" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });
  }

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${crypto.randomUUID()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const admin = supabaseAdmin();
  const { error } = await admin.storage
    .from("team-photos")
    .upload(path, bytes, { contentType: file.type || "image/jpeg", upsert: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = admin.storage.from("team-photos").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
