import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { categoryInput } from '@/lib/discovery-categories';
import { checkPostText } from '@/lib/moderation.functions';
import { freeWorkCategory } from '@/lib/free-work';

export const addDiscoveryCategory = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(input => categoryInput.parse(input))
  .handler(async ({ data, context }) => {
    const allowed = await context.supabase.rpc('account_allowed', { _uid: context.userId });
    if (allowed.error || !allowed.data) throw new Error('ACCOUNT_NOT_ALLOWED');
    const existing = await context.supabase.from('discovery_categories').select('id,name').eq('section', data.section);
    if (existing.error) throw existing.error;
    const duplicate = existing.data.find(row => freeWorkCategory(row.name) === freeWorkCategory(data.name));
    if (duplicate) return duplicate.id;
    const moderation = await checkPostText({ data: { text: data.name } });
    if (!moderation.ok) throw new Error('BAD_CONTENT');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const result = await supabaseAdmin.rpc('add_discovery_category', { _section: data.section, _name: data.name, _creator: context.userId });
    if (result.error) throw result.error;
    return result.data;
  });