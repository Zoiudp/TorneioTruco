"use client";

import { useEffect, useState } from "react";

// Porta de senha. Valida a senha no servidor ANTES de liberar a interface,
// dando retorno imediato ("senha incorreta") em vez de deixar entrar e depois
// derrubar o usuário numa ação. Guarda a senha na sessionStorage.
export function PasswordGate({
  storageKey,
  role,
  title,
  children,
}: {
  storageKey: string;
  role: "admin" | "judge";
  title: string;
  children: (password: string, logout: () => void) => React.ReactNode;
}) {
  const [password, setPassword] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey);
    if (saved) setPassword(saved);
  }, [storageKey]);

  async function enter() {
    const pw = input.trim();
    if (!pw) return;
    setChecking(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth?role=${role}`, {
        method: "POST",
        headers: { "x-password": pw },
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        const cfg = json.server_config;
        const missing =
          cfg && ((role === "admin" && !cfg.admin_password_set) || (role === "judge" && !cfg.judge_password_set));
        setError(
          missing
            ? "Servidor sem senha configurada. Defina as variáveis de ambiente na Vercel e refaça o deploy."
            : "Senha incorreta."
        );
        return;
      }
      sessionStorage.setItem(storageKey, pw);
      setPassword(pw);
    } catch {
      setError("Falha de conexão com o servidor.");
    } finally {
      setChecking(false);
    }
  }

  function logout() {
    sessionStorage.removeItem(storageKey);
    setPassword(null);
    setInput("");
  }

  if (!password) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-black/30 border border-white/10 rounded-2xl p-8 w-full max-w-sm text-center">
          <h1 className="text-2xl font-extrabold text-gold-400 mb-1">{title}</h1>
          <p className="text-white/60 mb-6 text-sm">Informe a senha de acesso.</p>
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && enter()}
            placeholder="Senha"
            autoComplete="current-password"
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 outline-none focus:border-gold-400"
          />
          {error && (
            <p className="mt-3 text-sm text-red-300 bg-red-500/15 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <button
            onClick={enter}
            disabled={checking}
            className="mt-4 w-full py-3 rounded-lg bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-felt-900 font-extrabold transition"
          >
            {checking ? "Verificando…" : "Entrar"}
          </button>
          <a href="/" className="block mt-4 text-white/50 text-sm hover:text-white">
            ← Voltar
          </a>
        </div>
      </div>
    );
  }

  return <>{children(password, logout)}</>;
}
