-- Mantém vehicles.last_inspection_at e next_inspection_due alinhados com
-- a última vistoria concluída em inspections (fonte de verdade no banco).
-- Regra de próxima data espelha o app: daily +1d, weekly +7d, biweekly +15d, monthly +1 mês.-- Regra de próxima data: daily +1d, weekly próxima quarta-feira, biweekly +15d, monthly +1 mês.
-- O trigger roda com SECURITY DEFINER para não depender de RLS em vehicles na sessão do cliente.

CREATE OR REPLACE FUNCTION public.movicar_next_inspection_due(
  p_base timestamptz,
  p_frequency text
) RETURNS timestamptz
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN p_base IS NULL OR p_frequency IS NULL THEN NULL
    WHEN p_frequency = 'daily' THEN p_base + interval '1 day'
    WHEN p_frequency = 'weekly' THEN
(
  (p_base AT TIME ZONE 'America/Sao_Paulo')
  + make_interval(
      days => CASE
        WHEN ((3 - EXTRACT(DOW FROM (p_base AT TIME ZONE 'America/Sao_Paulo'))::int + 7) % 7) = 0
          THEN 7
        ELSE ((3 - EXTRACT(DOW FROM (p_base AT TIME ZONE 'America/Sao_Paulo'))::int + 7) % 7)
      END
    )
) AT TIME ZONE 'America/Sao_Paulo'
    WHEN p_frequency = 'biweekly' THEN p_base + interval '15 days'
    WHEN p_frequency = 'monthly' THEN p_base + interval '1 month'
    ELSE NULL
  END
$$;

CREATE OR REPLACE FUNCTION public.refresh_vehicle_from_inspections(p_vehicle_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last timestamptz;
  v_freq text;
  v_next timestamptz;
BEGIN
  IF p_vehicle_id IS NULL THEN
    RETURN;
  END IF;

  SELECT max(i.finished_at) INTO v_last
  FROM public.inspections i
  WHERE i.vehicle_id = p_vehicle_id
    AND i.status = 'completed'
    AND i.finished_at IS NOT NULL;

  SELECT v.inspection_frequency::text INTO v_freq
  FROM public.vehicles v
  WHERE v.id = p_vehicle_id;

  IF v_last IS NULL OR v_freq IS NULL OR v_freq = '' THEN
    v_next := NULL;
  ELSE
    v_next := public.movicar_next_inspection_due(v_last, v_freq);
  END IF;

  UPDATE public.vehicles
  SET
    last_inspection_at = v_last,
    next_inspection_due = v_next
  WHERE id = p_vehicle_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_inspections_refresh_vehicle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_vehicle_from_inspections(OLD.vehicle_id);
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vehicle_id IS DISTINCT FROM NEW.vehicle_id THEN
      PERFORM public.refresh_vehicle_from_inspections(OLD.vehicle_id);
    END IF;
    PERFORM public.refresh_vehicle_from_inspections(NEW.vehicle_id);
  ELSE
    PERFORM public.refresh_vehicle_from_inspections(NEW.vehicle_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_inspections_sync_vehicle ON public.inspections;

CREATE TRIGGER trg_inspections_sync_vehicle
  AFTER INSERT OR UPDATE OR DELETE ON public.inspections
  FOR EACH ROW
  EXECUTE PROCEDURE public.trg_inspections_refresh_vehicle();

REVOKE ALL ON FUNCTION public.movicar_next_inspection_due(timestamptz, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refresh_vehicle_from_inspections(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.trg_inspections_refresh_vehicle() FROM PUBLIC;

-- Reconciliar dados existentes (vistorias já gravadas e veículos defasados).
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM public.vehicles
  LOOP
    PERFORM public.refresh_vehicle_from_inspections(r.id);
  END LOOP;
END;
$$;
