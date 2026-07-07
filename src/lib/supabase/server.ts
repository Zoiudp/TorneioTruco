import { createClient } from "@supabase/supabase-js";

// Client de servidor — usa a chave SERVICE_ROLE. Ignora RLS e pode escrever.
// NUNCA importe este módulo em componentes de cliente.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

export function supabaseAdmin() {
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Client de leitura para uso em Server Components (usa a chave anon).
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export function supabaseServerRead() {
  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}
