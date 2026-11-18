import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { mayManageAccount } from './admin-account-rules';

export const manageAdminAccount = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ user: z.string().uuid(), action: z.enum(['block', 'remove']), confirmation: z.literal(true) }).parse(input))
  .handler(async ({ data, context }) => {
    const ownRole = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (ownRole.error || !ownRole.data) throw new Error('ADMIN_ONLY');
    const targetRole = await context.supabase.rpc('has_role', { _user_id: data.user, _role: 'admin' });
    if (targetRole.error || !mayManageAccount(true, context.userId, data.user, !!targetRole.data)) throw new Error('ADMIN_PROTECTED');
    const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
    const target = await db.auth.admin.getUserById(data.user);
    if (target.error || !target.data.user) throw new Error('ACCOUNT_UNAVAILABLE');
    // Ban first: active sessions are also rejected by existing account_allowed guards.
    const banned = await db.auth.admin.updateUserById(data.user, { ban_duration: '876000h' });
    if (banned.error) throw new Error('BLOCK_FAILED');
    const blocked = await db.from('account_blocks').upsert({ user_id: data.user, reason: 'నిర్వాహకుడు ఖాతాను నిలిపివేశారు.' });
    if (blocked.error) throw new Error('BLOCK_FAILED');
    if (data.action === 'block') return { action: 'block' as const };
    // Remove all owner-prefix files, including uploaded but unattached files.
    for (const bucket of ['chat-images', 'sharing-evidence', 'service-photos']) {
      async function clean(prefix: string) {
        for (;;) {
          const listed = await db.storage.from(bucket).list(prefix, { limit: 100 });
          if (listed.error) throw new Error('IMAGE_REMOVAL_FAILED');
          if (!listed.data.length) break;
          const files: string[] = [];
          for (const item of listed.data) {
            const path = `${prefix}/${item.name}`;
            if (item.id) files.push(path); else await clean(path);
          }
          if (files.length) {
            const removed = await db.storage.from(bucket).remove(files);
            if (removed.error) throw new Error('IMAGE_REMOVAL_FAILED');
          }
          if (!files.length) break;
        }
      }
      await clean(data.user);
    }
    const removed = await db.rpc('admin_remove_account_data', { _user: data.user });
    if (removed.error) throw new Error('DATA_REMOVAL_FAILED');
    const authRemoved = await db.auth.admin.deleteUser(data.user);
    if (authRemoved.error) throw new Error('ACCOUNT_REMOVAL_FAILED');
    return { action: 'remove' as const };
  });