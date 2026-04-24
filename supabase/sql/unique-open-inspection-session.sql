-- Uma sessão "aberta" (finished_at IS NULL) por par (vehicle_id, driver_id).
-- Evita duplicidade em concorrência; inserts extras falham com 23505.

CREATE UNIQUE INDEX IF NOT EXISTS inspection_sessions_one_open_per_vehicle_driver
ON public.inspection_sessions (vehicle_id, driver_id)
WHERE (finished_at IS NULL);
