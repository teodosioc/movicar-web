-- Persiste a quilometragem digitada durante a sessão de vistoria,
-- para que a retomada (refresh/fechamento do app) não perca o valor
-- nem pule a etapa de odômetro sem KM informado.
alter table public.inspection_sessions
  add column if not exists odometer integer;

comment on column public.inspection_sessions.odometer is
  'KM digitado pelo motorista na etapa de odômetro; copiado para inspections.odometer ao finalizar.';

-- Garante KM válido em novas vistorias concluídas, sem quebrar linhas antigas com NULL.
alter table public.inspections
  drop constraint if exists inspections_completed_odometer_check;

alter table public.inspections
  add constraint inspections_completed_odometer_check
  check (
    status <> 'completed'
    or odometer is null -- linhas legadas; app novo sempre envia valor
    or (odometer > 0 and odometer <= 1000000)
  );
