-- Opcional: só use se NÃO quiser usar SUPABASE_SERVICE_ROLE_KEY no servidor.
-- Isto permite que o browser (chave anon) leia todas as linhas de public.users,
-- o que expõe e-mails e roles a quem tiver a chave publicada no front.
--
-- Preferência: usar Supabase Auth e RLS com auth.uid(); esta política é apenas um atalho legado.

alter table public.users enable row level security;

drop policy if exists "anon_select_users_app_login" on public.users;

create policy "anon_select_users_app_login"
on public.users
for select
to anon
using (true);
