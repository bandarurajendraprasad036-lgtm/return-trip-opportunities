CREATE OR REPLACE FUNCTION public.profile_ready_for_actions(_user uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ SELECT public.has_role(_user,'admin') OR (public.account_allowed(_user) AND EXISTS(SELECT 1 FROM public.profiles p JOIN public.account_programs a ON a.user_id=p.id JOIN auth.users u ON u.id=p.id WHERE p.id=_user AND length(trim(p.full_name))>0 AND length(trim(p.location))>0 AND p.phone ~ '^[6-9][0-9]{9}$' AND length(trim(a.occupation))>0 AND length(trim(a.category))>0 AND length(trim(a.member_kind))>0 AND ((u.phone_confirmed_at IS NOT NULL AND right(regexp_replace(u.phone,'[^0-9]','','g'),10)=p.phone) OR lower(u.email)=p.phone||'@phone.returnconnect.app'))); $function$;