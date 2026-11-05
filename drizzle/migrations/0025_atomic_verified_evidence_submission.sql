CREATE FUNCTION public.submit_verified_post_evidence(_user uuid,_post uuid,_purpose text,_paths text[],_hashes text[]) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE claim uuid; BEGIN
PERFORM set_config('request.jwt.claim.sub',_user::text,true);
claim:=public.submit_post_evidence(_post,_purpose,_paths);
PERFORM public.record_evidence_hashes(claim,_hashes); RETURN claim; END $$;
REVOKE ALL ON FUNCTION public.submit_verified_post_evidence(uuid,uuid,text,text[],text[]) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.submit_verified_post_evidence(uuid,uuid,text,text[],text[]) TO service_role;
REVOKE ALL ON FUNCTION public.submit_post_evidence(uuid,text,text[]) FROM authenticated;
COMMENT ON FUNCTION public.submit_verified_post_evidence(uuid,uuid,text,text[],text[]) IS 'Only server-inspected owner files and computed SHA256 digests; duplicate insert rolls back claim, chat message and hash registration together.';