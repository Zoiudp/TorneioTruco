"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PasswordGate } from "@/components/PasswordGate";
import { useTournamentData } from "@/lib/useTournamentData";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import type { Settings } from "@/lib/types";

function AdminPanel({ password, logout }: { password: string; logout: () => void }) {
  const { teams, groups, matches, settings, loading, refetch } = useTournamentData();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  function flash(setter: (v: string | null) => void, text: string) {
    setter(text);
    setTimeout(() => setter(null), 4000);
  }

  async function api(path: string, method: string, body?: unknown, isForm = false) {
    const headers: Record<string, string> = { "x-password": password };
    if (!isForm) headers["Content-Type"] = "application/json";
    const res = await fetch(path, {
      method,
      headers,
      body: isForm ? (body as FormData) : body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) logout();
      throw new Error(json.error ?? "Erro");
    }
    return json;
  }

  async function uploadPhoto(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const json = await api("/api/upload", "POST", fd, true);
    return json.url as string;
  }

  // -------- Configuração --------
  const [form, setForm] = useState<Partial<Settings>>({});
  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  async function saveSettings() {
    setWorking(true);
    try {
      await api("/api/bracket", "POST", {
        action: "update-settings",
        num_groups: Number(form.num_groups),
        qualifiers_per_group: Number(form.qualifiers_per_group),
        best_of: Number(form.best_of),
        tournament_name: form.tournament_name,
      });
      flash(setMsg, "Configuração salva.");
      refetch();
    } catch (e) {
      flash(setErr, (e as Error).message);
    } finally {
      setWorking(false);
    }
  }

  // -------- Cadastro de dupla --------
  const [tName, setTName] = useState("");
  const [p1Name, setP1Name] = useState("");
  const [p2Name, setP2Name] = useState("");
  const [p1File, setP1File] = useState<File | null>(null);
  const [p2File, setP2File] = useState<File | null>(null);

  async function addTeam() {
    if (!tName || !p1Name || !p2Name) {
      flash(setErr, "Preencha nome da dupla e dos dois jogadores.");
      return;
    }
    setWorking(true);
    try {
      const p1url = p1File ? await uploadPhoto(p1File) : null;
      const p2url = p2File ? await uploadPhoto(p2File) : null;
      await api("/api/teams", "POST", {
        name: tName,
        player1_name: p1Name,
        player1_photo_url: p1url,
        player2_name: p2Name,
        player2_photo_url: p2url,
      });
      setTName(""); setP1Name(""); setP2Name(""); setP1File(null); setP2File(null);
      flash(setMsg, "Dupla cadastrada.");
      refetch();
    } catch (e) {
      flash(setErr, (e as Error).message);
    } finally {
      setWorking(false);
    }
  }

  async function deleteTeam(id: string) {
    if (!confirm("Remover esta dupla?")) return;
    try {
      await api(`/api/teams?id=${id}`, "DELETE");
      refetch();
    } catch (e) {
      flash(setErr, (e as Error).message);
    }
  }

  // -------- Geração --------
  async function generate(action: string, confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setWorking(true);
    try {
      const json = await api("/api/bracket", "POST", { action });
      flash(setMsg, "Feito! " + JSON.stringify(json));
      refetch();
    } catch (e) {
      flash(setErr, (e as Error).message);
    } finally {
      setWorking(false);
    }
  }

  const groupMatches = matches.filter((m) => m.phase === "group");
  const groupsDone = groupMatches.length > 0 && groupMatches.every((m) => m.status === "done");

  return (
    <main className="min-h-screen max-w-4xl mx-auto p-4 space-y-8">
      <header className="flex items-center justify-between py-2">
        <h1 className="text-2xl font-black text-gold-400">🛠️ Organizador</h1>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/telao" className="text-white/50 hover:text-white">Telão</Link>
          <Link href="/" className="text-white/50 hover:text-white">Início</Link>
          <button onClick={logout} className="text-white/50 hover:text-white">Sair</button>
        </div>
      </header>

      {msg && <div className="px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/40 text-green-200 text-sm break-all">{msg}</div>}
      {err && <div className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-200 text-sm">{err}</div>}

      {/* Configuração */}
      <section className="bg-black/25 border border-white/10 rounded-2xl p-5">
        <h2 className="font-extrabold text-gold-400 mb-4 uppercase tracking-wide text-sm">Configuração</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Nome do torneio
            <input className="input" value={form.tournament_name ?? ""} onChange={(e) => setForm({ ...form, tournament_name: e.target.value })} />
          </label>
          <label className="text-sm">
            Nº de grupos
            <input type="number" min={1} className="input" value={form.num_groups ?? 2} onChange={(e) => setForm({ ...form, num_groups: Number(e.target.value) })} />
          </label>
          <label className="text-sm">
            Classificados por grupo
            <input type="number" min={1} className="input" value={form.qualifiers_per_group ?? 2} onChange={(e) => setForm({ ...form, qualifiers_per_group: Number(e.target.value) })} />
          </label>
          <label className="text-sm">
            Melhor de (jogos)
            <input type="number" min={1} step={2} className="input" value={form.best_of ?? 3} onChange={(e) => setForm({ ...form, best_of: Number(e.target.value) })} />
          </label>
        </div>
        <button disabled={working} onClick={saveSettings} className="btn-gold mt-4">Salvar configuração</button>
      </section>

      {/* Cadastro de dupla */}
      <section className="bg-black/25 border border-white/10 rounded-2xl p-5">
        <h2 className="font-extrabold text-gold-400 mb-4 uppercase tracking-wide text-sm">
          Cadastrar dupla ({teams.length})
        </h2>
        <div className="grid gap-3">
          <input className="input" placeholder="Nome da dupla" value={tName} onChange={(e) => setTName(e.target.value)} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <input className="input" placeholder="Jogador 1" value={p1Name} onChange={(e) => setP1Name(e.target.value)} />
              <input type="file" accept="image/*" className="text-sm text-white/70" onChange={(e) => setP1File(e.target.files?.[0] ?? null)} />
            </div>
            <div className="space-y-2">
              <input className="input" placeholder="Jogador 2" value={p2Name} onChange={(e) => setP2Name(e.target.value)} />
              <input type="file" accept="image/*" className="text-sm text-white/70" onChange={(e) => setP2File(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <button disabled={working} onClick={addTeam} className="btn-gold w-fit">
            {working ? "Enviando…" : "Adicionar dupla"}
          </button>
        </div>

        {/* Lista de duplas */}
        <div className="grid gap-2 mt-5 sm:grid-cols-2">
          {teams.map((t) => (
            <div key={t.id} className="flex items-center gap-3 bg-black/20 rounded-xl p-2">
              <div className="flex -space-x-2">
                <PlayerAvatar name={t.player1_name} photoUrl={t.player1_photo_url} size={40} />
                <PlayerAvatar name={t.player2_name} photoUrl={t.player2_photo_url} size={40} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gold-400 truncate">{t.name}</div>
                <div className="text-xs text-white/60 truncate">{t.player1_name} & {t.player2_name}</div>
              </div>
              <button onClick={() => deleteTeam(t.id)} className="text-red-400 hover:text-red-300 text-sm px-2">Remover</button>
            </div>
          ))}
        </div>
      </section>

      {/* Geração da chave */}
      <section className="bg-black/25 border border-white/10 rounded-2xl p-5 space-y-3">
        <h2 className="font-extrabold text-gold-400 uppercase tracking-wide text-sm">Chave</h2>
        <p className="text-white/60 text-sm">
          {groups.length > 0 ? `${groups.length} grupos • ${groupMatches.length} jogos de grupo` : "Grupos ainda não gerados."}
          {groupMatches.length > 0 && (groupsDone ? " • ✅ grupos concluídos" : " • ⏳ grupos em andamento")}
        </p>
        <div className="flex flex-wrap gap-3">
          <button disabled={working} onClick={() => generate("generate-groups", "Isto recria os grupos e apaga jogos existentes. Continuar?")} className="btn-gold">
            1) Gerar fase de grupos
          </button>
          <button disabled={working} onClick={() => generate("generate-knockout", groupsDone ? undefined : "Ainda há jogos de grupo pendentes. Gerar o mata-mata mesmo assim?")} className="btn-gold">
            2) Gerar mata-mata
          </button>
          <button disabled={working} onClick={() => generate("reset-all", "APAGAR grupos, jogos e sementes? As duplas permanecem.")} className="btn-danger">
            Resetar tudo
          </button>
        </div>
      </section>

      <style jsx>{`
        :global(.input) {
          display: block;
          width: 100%;
          margin-top: 4px;
          padding: 10px 12px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          outline: none;
        }
        :global(.input:focus) { border-color: #f5c542; }
        :global(.btn-gold) {
          padding: 10px 16px; border-radius: 10px; font-weight: 800;
          background: #e0ac2b; color: #0b2e1f; transition: background 0.15s;
        }
        :global(.btn-gold:hover) { background: #f5c542; }
        :global(.btn-gold:disabled) { opacity: 0.5; }
        :global(.btn-danger) {
          padding: 10px 16px; border-radius: 10px; font-weight: 800;
          background: rgba(239, 68, 68, 0.85); color: white;
        }
        :global(.btn-danger:hover) { background: rgb(239, 68, 68); }
      `}</style>
    </main>
  );
}

export default function AdminPage() {
  return (
    <PasswordGate storageKey="truco-admin-pw" title="🛠️ Acesso do Organizador">
      {(password, logout) => <AdminPanel password={password} logout={logout} />}
    </PasswordGate>
  );
}
