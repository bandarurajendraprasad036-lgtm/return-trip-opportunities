import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';

const input = z.object({ phone: z.string().regex(/^[6-9]\d{9}$/), password: z.string().min(6).max(72), request: z.string().uuid().nullable().optional() });

// Administrator sets a new password for a mobile-number account after confirming the person by phone.
export const adminResetPassword = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => input.parse(data))
  .handler(async ({ data, context }) => {
    const role = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (role.error || !role.data) throw new Error('ADMIN_ONLY');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const found = await supabaseAdmin.rpc('account_id_for_login_phone', { _phone: data.phone });
    if (found.error) throw new Error('LOOKUP_FAILED');
    if (!found.data) throw new Error('NO_ACCOUNT');
    const updated = await supabaseAdmin.auth.admin.updateUserById(found.data, { password: data.password });
    if (updated.error) throw new Error('RESET_FAILED');
    await context.supabase.from('password_reset_requests').update({ status: 'done', handled_at: new Date().toISOString(), handled_by: context.userId }).eq('phone', data.phone).eq('status', 'pending');
    return { ok: true };
  });
