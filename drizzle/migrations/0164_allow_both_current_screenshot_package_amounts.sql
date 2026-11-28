CREATE OR REPLACE FUNCTION public.mark_new_vehicle_plan()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.amount IS NULL OR NEW.amount NOT IN (100,349) THEN
    RAISE EXCEPTION 'RETIRED_PAYMENT_PLAN';
  END IF;
  NEW.vehicle_plan_months := 3;
  RETURN NEW;
END;
$$;
COMMENT ON FUNCTION public.mark_new_vehicle_plan() IS 'New screenshot receipts accept the current chat-only and full packages; approval remains separate and historical receipts are unchanged.';