# 🃏 Campeonato de Truco — Família Lima 2026

Sistema de gestão e **telão** para o torneio de truco da família. Cadastre as
duplas (com foto de cada jogador), gere a chave no formato **grupos + mata-mata**,
lance os resultados (partidas **melhor de 3**) e acompanhe **estatísticas em tempo
real** — tudo publicado na Vercel.

## Acessos

| Rota        | Para quem            | O que faz |
|-------------|----------------------|-----------|
| `/`         | todos                | página inicial com os atalhos |
| `/telao`    | projetor / TV        | carrossel de confrontos, grupos, chave e estatísticas, rotativo e ao vivo |
| `/publico`  | convidados (celular) | mesma informação, rolável |
| `/juiz`     | juízes (senha)       | lançar vencedor de cada jogo das partidas |
| `/admin`    | organizador (senha)  | cadastrar duplas, configurar e gerar a chave |

## Como funciona

- **Melhor de 3:** o juiz marca o vencedor de cada jogo; ao chegar a 2 vitórias a
  partida encerra, o vencedor/perdedor é gravado e, no mata-mata, o vencedor avança
  automaticamente para o próximo confronto.
- **Tempo real:** o telão e a visão pública usam Supabase Realtime — atualizam
  sozinhos ao fim de cada jogo, sem recarregar.
- **Byes automáticos:** se o número de classificados não for potência de 2, os
  cabeças de chave recebem bye na primeira rodada.
- **Segurança:** o público só lê. Toda escrita passa por rotas de API que validam a
  senha no servidor (as chaves secretas nunca vão para o navegador).

## Configuração (passo a passo)

### 1. Criar o projeto no Supabase (grátis)
1. Crie um projeto em <https://supabase.com>.
2. Abra **SQL Editor**, cole o conteúdo de [`supabase/schema.sql`](supabase/schema.sql)
   e rode. Isso cria tabelas, a view de estatísticas, o Realtime e o bucket de fotos.
3. Em **Project Settings → API**, copie: `Project URL`, `anon public` e `service_role`.

### 2. Variáveis de ambiente
Copie `.env.local.example` para `.env.local` e preencha:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
JUDGE_PASSWORD=senha-dos-juizes
ADMIN_PASSWORD=senha-do-organizador
```

### 3. Rodar localmente
```bash
npm install
npm run dev
```
Abra <http://localhost:3000>.

### 4. Usar
1. Em **`/admin`**: ajuste a configuração (nº de grupos, classificados por grupo),
   cadastre as duplas com as fotos, clique em **Gerar fase de grupos**.
2. Jogos acontecem; em **`/juiz`** os árbitros lançam os resultados.
3. Quando os grupos terminarem, no **`/admin`** clique em **Gerar mata-mata**.
4. Deixe **`/telao`** aberto no projetor.

## Deploy na Vercel

1. Suba o projeto para um repositório no GitHub.
2. Em <https://vercel.com>, **Import Project** apontando para o repositório.
3. Em **Settings → Environment Variables**, adicione as mesmas 5 variáveis do
   `.env.local`.
4. Deploy. (Alternativa: `npx vercel` no terminal.)

## Estrutura

```
supabase/schema.sql          Banco: tabelas, view de estatísticas, RLS, Realtime, storage
src/lib/tournament.ts        Lógica pura: grupos, classificação, bracket com byes, melhor-de-N
src/lib/useTournamentData.ts Hook de dados + assinatura Realtime
src/lib/supabase/            Clients anon (leitura) e service_role (escrita no servidor)
src/app/api/                 Route Handlers com validação de senha (upload, teams, matches, bracket)
src/app/                     Páginas: /, /telao, /publico, /juiz, /admin
src/components/              DuplaCard, MatchCarousel, GroupTable, BracketView, StatsBoard, PasswordGate
```

## Notas
- Juiz e admin usam **senha única compartilhada** (por decisão do organizador). A
  senha de admin também funciona no painel do juiz.
- As estatísticas mostram, por dupla: **partidas ganhas/perdidas** e **jogos
  ganhos/perdidos** (com saldo).
