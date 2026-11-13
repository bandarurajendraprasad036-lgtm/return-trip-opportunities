CREATE TABLE public.discovery_categories (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 section text NOT NULL CHECK(section IN ('goods','returns','cars','work-wanted','work-offered','service-providers','service-wanted')),
 name text NOT NULL CHECK(length(trim(name)) BETWEEN 2 AND 40),
 normalized_name text GENERATED ALWAYS AS (lower(trim(name))) STORED,
 created_by uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(section,normalized_name)
);
GRANT SELECT(id,section,name,created_at) ON public.discovery_categories TO anon,authenticated;
GRANT ALL ON public.discovery_categories TO service_role;
ALTER TABLE public.discovery_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY public_category_names ON public.discovery_categories FOR SELECT TO anon,authenticated USING(true);
CREATE FUNCTION public.guard_category_words() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF lower(NEW.name) ~ '(^|[^[:alnum:]_])(fuck|bitch|asshole|motherfucker|madarchod|behenchod|chutiya|lanjakodaka)([^[:alnum:]_]|$)' OR NEW.name ~ '(లంజ|దెంగ|పూకు|మొడ్డ|సుల్లి)' OR lower(NEW.name) ~ '(promote terrorism|join isis|terror attack planning|ఉగ్రదాడి ప్రణాళిక|ఉగ్రవాదాన్ని ప్రోత్సహించ)' THEN RAISE EXCEPTION 'BAD_CONTENT'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER discovery_category_words BEFORE INSERT OR UPDATE ON public.discovery_categories FOR EACH ROW EXECUTE FUNCTION public.guard_category_words();
CREATE FUNCTION public.add_discovery_category(_section text,_name text,_creator uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE result uuid;
BEGIN
 IF NOT public.account_allowed(_creator) THEN RAISE EXCEPTION 'ACCOUNT_NOT_ALLOWED'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(_creator::text,0));
 SELECT id INTO result FROM public.discovery_categories WHERE section=_section AND normalized_name=lower(trim(_name));
 IF result IS NOT NULL THEN RETURN result; END IF;
 IF (SELECT count(*) FROM public.discovery_categories WHERE created_by=_creator AND created_at>now()-interval '1 day')>=20 THEN RAISE EXCEPTION 'CATEGORY_LIMIT'; END IF;
 INSERT INTO public.discovery_categories(section,name,created_by) VALUES(_section,trim(_name),_creator) ON CONFLICT(section,normalized_name) DO UPDATE SET name=discovery_categories.name RETURNING id INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.add_discovery_category(text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.add_discovery_category(text,text,uuid) TO service_role;
COMMENT ON TABLE public.discovery_categories IS 'Shared moderated type names only, never actual available listings; creator identity is private and writes require authenticated server moderation.';