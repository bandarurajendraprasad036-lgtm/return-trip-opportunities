import { supabase } from '@/integrations/supabase/client';

export const SUBSCRIPTION_MESSAGE = 'మీరు ₹100 చెల్లించి చందా తీసుకోండి! మూడు నెలల చందా కేవలం ₹100 మాత్రమే!';
export function showSubscriptionNotice() {
  window.dispatchEvent(new Event('gayatri-subscription-required'));
}
export async function requireSubscription() {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) { showSubscriptionNotice(); return false; }
  const [paid, admin] = await Promise.all([
    supabase.rpc('has_paid_bell', { _user: user.id }),
    supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }),
  ]);
  if (paid.error || admin.error) throw paid.error || admin.error;
  if (paid.data || admin.data) return true;
  showSubscriptionNotice();
  return false;
}