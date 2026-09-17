-- Tabela de notificações internas (admins recebem aviso de vistoria concluída).
-- Estrutura replicada do ambiente de homologação (movicar-homol).
-- Gravada apenas pela rota /api/notifications/inspection-completed via service role.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id),
  type text not null,
  title text not null,
  message text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Sem policies: acesso somente via service role (a rota da API).
alter table public.notifications enable row level security;
