CREATE OR REPLACE FUNCTION public.guard_bad_words()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE t text;
BEGIN
  t := lower(coalesce(NEW.title,'')||' '||coalesce(NEW.description,'')||' '||coalesce(NEW.skill,'')||' '||coalesce(NEW.location,'')||' '||coalesce(NEW.goods_type,'')||' '||coalesce(NEW.from_place,'')||' '||coalesce(NEW.to_place,'')||' '||coalesce(NEW.service_type,'')||' '||coalesce(NEW.public_brand,''));
  IF t ~ '(fuck|bitch|bastard|asshole|motherfucker|madarchod|behenchod|bhenchod|chutiya|randi|gandu|harami|lanjа|lanja|dengu|dengey|pooku|modda|sulli|lanjakodaka|బూతు|లంజ|దెంగ|పూకు|మొడ్డ|సుల్లి|లంజకొడుకు|దొంగనా|terror|terrorist|bomb blast|jihad|isis|pakistan zindabad|anti[- ]?national|bharat murdabad|desh virodhi|naxal|maoist attack|తీవ్రవాద|ఉగ్రవాద|బాంబు|దేశ ద్రోహ|దేశద్రోహ|దేశ వ్యతిరేక)' THEN
    RAISE EXCEPTION 'BAD_CONTENT' USING HINT = 'బూతులు / దేశ వ్యతిరేక మాటలు అనుమతి లేదు';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS posts_bad_words ON public.posts;
CREATE TRIGGER posts_bad_words BEFORE INSERT OR UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.guard_bad_words();