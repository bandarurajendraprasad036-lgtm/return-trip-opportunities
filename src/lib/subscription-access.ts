import { supabase } from '@/integrations/supabase/client';

export const SUBSCRIPTION_MESSAGE = 'మీరు ₹100 చెల్లించి చందా తీసుకోండి! మూడు నెలల చందా కేవలం ₹100 మాత్రమే!';

export function showSubscriptionNotice() {
  window.dispatchEvent(new Event('gayatri-subscription-required'));
}

export async function requireSubscription() {
  return true;
}
