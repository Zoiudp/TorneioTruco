-- ============================================================================
-- Campeonato de Truco - Família Lima 2026
-- Schema do Supabase (Postgres) + RLS + Realtime + Storage
-- Rode este arquivo inteiro no SQL Editor do painel do Supabase.
-- ============================================================================

-- --------------------------------------------------------------------------
-- Limpeza (permite rodar novamente do zero durante testes)
-- --------------------------------------------------------------------------
drop view if exists team_stats cascade;
drop table if exists matches cascade;
drop table if exists teams cascade;
drop table if exists groups cascade;
drop table if exists settings cascade;

-- --------------------------------------------------------------------------
-- Tabelas
-- --------------------------------------------------------------------------
create table groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

create table teams (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  player1_name   text not null,
  player1_photo_url text,
  player2_name   text not null,
  player2_photo_url text,
  group_id       uuid references groups(id) on delete set null,
  seed           int  not null default 0,
  created_at     timestamptz not null default now()
);

create table matches (
  id              uuid primary key default gen_random_uuid(),
  phase           text not null check (phase in ('group','knockout')),
  round           int  not null default 0,          -- 0 = grupos; 1..N = rodadas do mata-mata
  round_label     text,                             -- ex: "Quartas", "Semifinal", "Final"
  order_index     int  not null default 0,          -- ordem dos confrontos (carrossel/agenda)
  group_id        uuid references groups(id) on delete cascade,
  team_a_id       uuid references teams(id) on delete cascade,
  team_b_id       uuid references teams(id) on delete cascade,  -- null quando bye
  games_a         int  not null default 0,          -- jogos vencidos pela dupla A (0-2)
  games_b         int  not null default 0,          -- jogos vencidos pela dupla B (0-2)
  status          text not null default 'pending' check (status in ('pending','live','done')),
  winner_id       uuid references teams(id) on delete set null,
  loser_id        uuid references teams(id) on delete set null,
  next_match_id   uuid references matches(id) on delete set null,
  next_match_slot text check (next_match_slot in ('a','b')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Configuração única do torneio (linha singleton com id = 1)
create table settings (
  id                   int primary key default 1,
  num_groups           int not null default 2,
  qualifiers_per_group int not null default 2,
  best_of              int not null default 3,     -- melhor de N (padrão 3)
  tournament_name      text not null default 'Campeonato de Truco — Família Lima 2026',
  bracket_generated    boolean not null default false,
  constraint settings_singleton check (id = 1)
);

insert into settings (id) values (1) on conflict (id) do nothing;

-- --------------------------------------------------------------------------
-- View de estatísticas por dupla (partidas e jogos ganhos/perdidos)
-- Considera apenas partidas concluídas (status = 'done').
-- --------------------------------------------------------------------------
create or replace view team_stats as
with per_match as (
  -- lado A
  select
    m.team_a_id as team_id,
    case when m.winner_id = m.team_a_id then 1 else 0 end as match_won,
    case when m.status = 'done' and m.winner_id <> m.team_a_id then 1 else 0 end as match_lost,
    m.games_a as games_won,
    m.games_b as games_lost
  from matches m
  where m.status = 'done' and m.team_a_id is not null
  union all
  -- lado B
  select
    m.team_b_id as team_id,
    case when m.winner_id = m.team_b_id then 1 else 0 end as match_won,
    case when m.status = 'done' and m.winner_id <> m.team_b_id then 1 else 0 end as match_lost,
    m.games_b as games_won,
    m.games_a as games_lost
  from matches m
  where m.status = 'done' and m.team_b_id is not null
)
select
  t.id                                   as team_id,
  t.name                                 as team_name,
  t.group_id,
  coalesce(sum(pm.match_won), 0)::int    as matches_won,
  coalesce(sum(pm.match_lost), 0)::int   as matches_lost,
  coalesce(sum(pm.games_won), 0)::int    as games_won,
  coalesce(sum(pm.games_lost), 0)::int   as games_lost,
  coalesce(sum(pm.games_won), 0)::int
    - coalesce(sum(pm.games_lost), 0)::int as games_diff
from teams t
left join per_match pm on pm.team_id = t.id
group by t.id, t.name, t.group_id;

-- --------------------------------------------------------------------------
-- Row Level Security
-- Leitura pública (anon). Escrita SOMENTE via service_role (Route Handlers),
-- que ignora RLS. Portanto NÃO criamos policies de insert/update/delete
-- para anon: o público não consegue escrever.
-- --------------------------------------------------------------------------
alter table groups   enable row level security;
alter table teams    enable row level security;
alter table matches  enable row level security;
alter table settings enable row level security;

create policy "public read groups"   on groups   for select using (true);
create policy "public read teams"     on teams    for select using (true);
create policy "public read matches"   on matches  for select using (true);
create policy "public read settings"  on settings for select using (true);

-- --------------------------------------------------------------------------
-- Realtime: publica mudanças destas tabelas para os assinantes (telão)
-- --------------------------------------------------------------------------
alter publication supabase_realtime add table matches;
alter publication supabase_realtime add table teams;
alter publication supabase_realtime add table groups;

-- --------------------------------------------------------------------------
-- Storage: bucket público para as fotos das duplas
-- --------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('team-photos', 'team-photos', true)
on conflict (id) do nothing;

-- Leitura pública das imagens
create policy "public read team photos"
  on storage.objects for select
  using (bucket_id = 'team-photos');
