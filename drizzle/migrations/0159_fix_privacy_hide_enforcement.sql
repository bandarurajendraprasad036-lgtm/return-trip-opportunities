CREATE OR REPLACE FUNCTION public.sync_show_choice_bell_consent()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND coalesce(OLD.public_bell_consent, false) AND NOT coalesce(NEW.public_bell_consent, false) THEN
    NEW.hide_name := true;
    NEW.hide_phone := true;
    NEW.hide_photo := true;
    RETURN NEW;
  END IF;

  IF (
    (NOT coalesce(NEW.hide_name, true) AND (TG_OP = 'INSERT' OR coalesce(OLD.hide_name, true)))
    OR (NOT coalesce(NEW.hide_phone, true) AND (TG_OP = 'INSERT' OR coalesce(OLD.hide_phone, true)))
    OR (NOT coalesce(NEW.hide_photo, true) AND (TG_OP = 'INSERT' OR coalesce(OLD.hide_photo, true)))
  ) THEN
    NEW.public_bell_consent := true;
  END IF;

  RETURN NEW;
END
$function$;

CREATE OR REPLACE FUNCTION public.get_post_details(_post uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  p public.posts;
  pr public.profiles;
  privileged boolean;
  contact boolean;
  allow_name boolean;
  allow_phone boolean;
  allow_photo boolean;
BEGIN
  SELECT * INTO p
  FROM public.posts
  WHERE id = _post
    AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR (public.post_listing_visible(posts) AND public.account_allowed(user_id)));

  IF p.id IS NULL THEN
    RAISE EXCEPTION 'POST_UNAVAILABLE';
  END IF;

  SELECT * INTO pr FROM public.profiles WHERE id = p.user_id;

  privileged := p.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin');
  contact := privileged OR (auth.uid() IS NOT NULL AND public.my_profile_access_ready() AND p.show_contact AND (p.module <> 'vehicle' OR public.vehicle_contact_access(auth.uid())));
  allow_name := privileged OR (contact AND NOT coalesce(pr.hide_name, false));
  allow_phone := privileged OR (contact AND NOT coalesce(pr.hide_phone, false));
  allow_photo := privileged OR (contact AND NOT coalesce(pr.hide_photo, false));

  RETURN jsonb_build_object(
    'description', CASE WHEN p.module <> 'vehicle' OR contact THEN p.description ELSE NULL END,
    'goods_type', p.goods_type,
    'capacity_tons', p.capacity_tons,
    'trip_date', p.trip_date,
    'created_at', p.created_at,
    'vehicle_photo_path', CASE WHEN allow_photo THEN p.vehicle_photo_path ELSE '' END,
    'vehicle_name', p.vehicle_name,
    'vehicle_number', CASE WHEN contact THEN p.vehicle_number ELSE NULL END,
    'driver_name', CASE WHEN allow_name THEN p.driver_name ELSE NULL END,
    'contact_phone', CASE WHEN allow_phone THEN p.contact_phone ELSE NULL END,
    'public_brand', CASE WHEN contact THEN p.public_brand ELSE '' END,
    'public_photo', CASE WHEN allow_photo AND p.public_photo ~ '^https://' THEN p.public_photo ELSE '' END
  );
END
$function$;