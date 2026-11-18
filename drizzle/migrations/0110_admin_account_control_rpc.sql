-- The external custom-domain host has no server env, so admin block/remove must be a self-authorizing RPC.
CREATE TABLE IF NOT EXISTS public.storage_cleanup_queue(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket text NOT NULL,
  prefix text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
GRANT ALL ON public.storage_cleanup_queue TO service_role;
ALTER TABLE public.storage_cleanup_queue ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.admin_remove_account_data(_user uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ BEGIN
IF auth.role()<>'service_role' AND NOT (auth.uid() IS NOT NULL AND public.has_role(auth.uid(),'admin') AND _user<>auth.uid()) THEN RAISE EXCEPTION 'SERVICE_ONLY'; END IF;
IF EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user AND role='admin') THEN RAISE EXCEPTION 'ADMIN_PROTECTED'; END IF;
UPDATE public.profiles SET referred_by=NULL WHERE referred_by=_user;
UPDATE public.phone_entry_requests SET reviewed_by=NULL WHERE reviewed_by=_user;
DELETE FROM public.phone_entry_requests WHERE account_id=_user;
DELETE FROM public.job_post_uses WHERE user_id=_user OR entitlement_id IN(SELECT id FROM public.job_post_entitlements WHERE user_id=_user OR payment_id IN(SELECT id FROM public.membership_payments WHERE user_id=_user));
DELETE FROM public.referral_board_consent WHERE user_id=_user;
DELETE FROM public.referral_invitee_rewards WHERE user_id=_user OR receipt_id IN(SELECT id FROM public.referral_cash_receipts WHERE user_id=_user);
DELETE FROM public.program_reminders WHERE user_id=_user OR notification_id IN(SELECT id FROM public.notifications WHERE user_id=_user);
DELETE FROM public.payment_image_checks WHERE payer_id=_user OR message_id IN(SELECT id FROM public.messages WHERE sender_id=_user OR receiver_id=_user);
DELETE FROM public.service_photos WHERE user_id=_user;
DELETE FROM public.service_reviews WHERE author_id=_user OR profile_id=_user;
DELETE FROM public.service_likes WHERE user_id=_user OR profile_id=_user;
DELETE FROM public.service_views WHERE profile_id=_user;
DELETE FROM public.service_chat_pairs WHERE member_id=_user OR owner_id=_user;
DELETE FROM public.service_profiles WHERE user_id=_user;
DELETE FROM public.reward_wallets WHERE user_id=_user;
DELETE FROM public.free_membership_months WHERE user_id=_user;
DELETE FROM public.sharing_claims WHERE user_id=_user;
DELETE FROM public.notification_preferences WHERE user_id=_user;
DELETE FROM public.push_deliveries WHERE user_id=_user OR notification_id IN(SELECT id FROM public.notifications WHERE user_id=_user OR bell_actor=_user OR post_id IN(SELECT id FROM public.posts WHERE user_id=_user));
DELETE FROM public.push_devices WHERE user_id=_user;
DELETE FROM public.job_post_entitlements WHERE user_id=_user OR payment_id IN(SELECT id FROM public.membership_payments WHERE user_id=_user);
DELETE FROM public.post_sharing_evidence WHERE user_id=_user OR post_id IN(SELECT id FROM public.posts WHERE user_id=_user);
DELETE FROM public.evidence_content_registry WHERE user_id=_user;
DELETE FROM public.account_blocks WHERE user_id=_user;
DELETE FROM public.vehicle_route_points WHERE user_id=_user;
DELETE FROM public.approximate_route_alerts WHERE user_id=_user OR post_id IN(SELECT id FROM public.posts WHERE user_id=_user) OR notification_id IN(SELECT id FROM public.notifications WHERE user_id=_user OR bell_actor=_user);
DELETE FROM public.vehicle_route_preferences WHERE user_id=_user;
DELETE FROM public.vehicle_post_points WHERE user_id=_user OR post_id IN(SELECT id FROM public.posts WHERE user_id=_user);
DELETE FROM public.vehicle_availability WHERE user_id=_user OR post_id IN(SELECT id FROM public.posts WHERE user_id=_user);
DELETE FROM public.vehicle_availability_requests WHERE user_id=_user OR post_id IN(SELECT id FROM public.posts WHERE user_id=_user);
DELETE FROM public.post_chat_pairs WHERE member_id=_user OR owner_id=_user OR post_id IN(SELECT id FROM public.posts WHERE user_id=_user);
DELETE FROM public.account_programs WHERE user_id=_user;
DELETE FROM public.program_evidence WHERE user_id=_user;
DELETE FROM public.referral_vip_joins WHERE joined_user=_user OR referrer_id=_user;
DELETE FROM public.referral_prize_payouts WHERE receipt_id IN(SELECT receipt_id FROM public.referral_cash_rewards WHERE user_id=_user OR receipt_id IN(SELECT id FROM public.referral_cash_receipts WHERE user_id=_user));
DELETE FROM public.referral_cash_rewards WHERE user_id=_user OR receipt_id IN(SELECT id FROM public.referral_cash_receipts WHERE user_id=_user);
DELETE FROM public.referral_cash_receipts WHERE user_id=_user;
DELETE FROM public.referral_vip_notice_state WHERE user_id=_user;
DELETE FROM public.prime99_payments WHERE user_id=_user;
DELETE FROM public.monthly_post_periods WHERE user_id=_user;
DELETE FROM public.monthly_post_usage WHERE user_id=_user;
DELETE FROM public.daily_referral_board_notices WHERE user_id=_user OR notification_id IN(SELECT id FROM public.notifications WHERE user_id=_user OR bell_actor=_user);
DELETE FROM public.weekly_winners WHERE user_id=_user;
DELETE FROM public.provider_contacts WHERE user_id=_user;
DELETE FROM public.provider_contact_batches WHERE user_id=_user;
DELETE FROM public.deferred_listing_notices WHERE user_id=_user OR post_id IN(SELECT id FROM public.posts WHERE user_id=_user) OR matched_post_id IN(SELECT id FROM public.posts WHERE user_id=_user);
DELETE FROM public.service_request_pairs WHERE member_id=_user OR owner_id=_user OR request_id IN(SELECT id FROM public.service_requests WHERE user_id=_user);
DELETE FROM public.service_requests WHERE user_id=_user;
DELETE FROM public.service_chat_presence WHERE member_id=_user OR owner_id=_user;
DELETE FROM public.membership_access WHERE user_id=_user OR request_id IN(SELECT id FROM public.membership_requests WHERE user_id=_user OR payer_id=_user OR message_id IN(SELECT id FROM public.messages WHERE sender_id=_user OR receiver_id=_user));
DELETE FROM public.membership_requests WHERE user_id=_user OR payer_id=_user OR message_id IN(SELECT id FROM public.messages WHERE sender_id=_user OR receiver_id=_user);
DELETE FROM public.vehicle_demand_chat_pairs WHERE member_id=_user OR owner_id=_user OR demand_id IN(SELECT id FROM public.vehicle_bell_demands WHERE user_id=_user OR post_id IN(SELECT id FROM public.posts WHERE user_id=_user));
DELETE FROM public.notifications WHERE user_id=_user OR bell_actor=_user OR bell_demand IN(SELECT id FROM public.vehicle_bell_demands WHERE user_id=_user);
DELETE FROM public.vehicle_bell_demands WHERE user_id=_user OR post_id IN(SELECT id FROM public.posts WHERE user_id=_user);
DELETE FROM public.bell_board_chat_pairs WHERE member_id=_user OR owner_id=_user OR interest_id IN(SELECT id FROM public.post_bell_interests WHERE user_id=_user OR post_id IN(SELECT id FROM public.posts WHERE user_id=_user));
DELETE FROM public.post_bell_interests WHERE user_id=_user OR post_id IN(SELECT id FROM public.posts WHERE user_id=_user);
DELETE FROM public.free_work_notice_queue WHERE user_id=_user OR subscription_id IN(SELECT id FROM public.free_work_entries WHERE user_id=_user);
DELETE FROM public.free_work_entries WHERE user_id=_user;
DELETE FROM public.free_work_pairs WHERE member_id=_user OR owner_id=_user;
DELETE FROM public.free_work_interests WHERE user_id=_user;
DELETE FROM public.service_priority_applications WHERE user_id=_user;
DELETE FROM public.additional_recipient_payments WHERE payer_id=_user OR recipient_id IN(SELECT id FROM public.additional_phone_recipients WHERE owner_id=_user) OR message_id IN(SELECT id FROM public.messages WHERE sender_id=_user OR receiver_id=_user);
DELETE FROM public.additional_phone_recipients WHERE owner_id=_user;
DELETE FROM public.main_bell_actions WHERE user_id=_user;
DELETE FROM public.main_bell_runs WHERE user_id=_user;
DELETE FROM public.messages WHERE sender_id=_user OR receiver_id=_user;
DELETE FROM public.posts WHERE user_id=_user;
DELETE FROM public.membership_payments WHERE user_id=_user;
DELETE FROM public.discovery_categories WHERE created_by=_user;
DELETE FROM public.user_roles WHERE user_id=_user;
UPDATE public.membership_requests SET reviewed_by=NULL WHERE reviewed_by=_user;
UPDATE public.membership_access SET granted_by=NULL WHERE granted_by=_user;
UPDATE public.additional_recipient_payments SET reviewed_by=NULL WHERE reviewed_by=_user;
UPDATE public.prime99_payments SET reviewed_by=NULL WHERE reviewed_by=_user;
UPDATE public.provider_contact_batches SET reviewed_by=NULL WHERE reviewed_by=_user;
DELETE FROM public.profiles WHERE id=_user;
END $function$;

CREATE OR REPLACE FUNCTION public.admin_manage_account(_user uuid, _action text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'ADMIN_ONLY'; END IF;
  IF _action NOT IN ('block','remove') THEN RAISE EXCEPTION 'INVALID_ACTION'; END IF;
  IF _user = auth.uid() OR public.has_role(_user,'admin') THEN RAISE EXCEPTION 'ADMIN_PROTECTED'; END IF;
  IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=_user) THEN RAISE EXCEPTION 'ACCOUNT_UNAVAILABLE'; END IF;
  INSERT INTO public.account_blocks(user_id, reason) VALUES(_user,'నిర్వాహకుడు ఖాతాను నిలిపివేశారు.')
    ON CONFLICT (user_id) DO UPDATE SET reason=EXCLUDED.reason, blocked_at=now();
  UPDATE auth.users SET banned_until = now() + interval '100 years' WHERE id=_user;
  DELETE FROM auth.sessions WHERE user_id=_user;
  IF _action='block' THEN RETURN 'block'; END IF;
  INSERT INTO public.storage_cleanup_queue(bucket,prefix)
    SELECT b, _user::text FROM unnest(ARRAY['chat-images','sharing-evidence','service-photos']) b;
  PERFORM public.admin_remove_account_data(_user);
  DELETE FROM auth.users WHERE id=_user;
  RETURN 'remove';
END $$;
REVOKE ALL ON FUNCTION public.admin_manage_account(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_manage_account(uuid,text) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_remove_account_data(uuid) FROM PUBLIC, anon, authenticated;