"use client";

import { useEffect, useState } from "react";

// Porta de senha simples. Guarda a senha na sessionStorage e a repassa aos
// filhos. A validação real acontece no servidor (Route Handlers) a cada ação;
// aqui é só para revelar a interface de trabalho.
export function PasswordGate({
  storageKey,
  title,
  children,
}: {
  storageKey: string;
  title: string;
  children: (password: string, logout: () => void) => React.ReactNode;
}) {
  const [password, setPassword] = useState<string | null>(null);
  const [input, setInput] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey);
    if (saved) setPassword(saved);
  }, [storageKey]);

  function enter() {
    if (!input.trim()) return;
    sessionStorage.setItem(storageKey, input.trim());
    setPassword(input.trim());
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
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 outline-none focus:border-gold-400"
          />
          <button
            onClick={enter}
            className="mt-4 w-full py-3 rounded-lg bg-gold-500 hover:bg-gold-400 text-felt-900 font-extrabold transition"
          >
            Entrar
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
