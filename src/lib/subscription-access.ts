import { supabase } from '@/integrations/supabase/client';

export const SUBSCRIPTION_MESSAGE = 'చాట్‌కు ₹100; గంట, కాల్స్, అనుమతించిన వివరాలకు ₹349 — మూడు నెలలు';

export function showSubscriptionNotice() {
  window.dispatchEvent(new Event('gayatri-subscription-required'));
}

export async function requireSubscription() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return false;
  const [paid, admin] = await Promise.all([
    supabase.rpc('has_paid_bell', { _user: data.session.user.id }),
    supabase.rpc('has_role', { _user_id: data.session.user.id, _role: 'admin' }),
  ]);
  if (paid.error || admin.error) throw paid.error ?? admin.error;
  if (paid.data || admin.data) return true;
  showSubscriptionNotice();
  return false;
}
