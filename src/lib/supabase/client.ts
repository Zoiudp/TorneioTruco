"use client";

import { createClient } from "@supabase/supabase-js";

// Client de navegador — usa a chave ANON. Somente leitura no banco
// (garantido pelas policies RLS). Também usado para assinar o Realtime.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabaseBrowser = createClient(url, anonKey, {
  auth: { persistSession: false },
});
