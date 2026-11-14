import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
import { FREE_WORK_SECTIONS } from './free-work';

export const freeWorkAction = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ section: z.enum(FREE_WORK_SECTIONS), action: z.enum(['join', 'ring', 'category', 'chat']), category: z.string().trim().max(40).default(''), area: z.string().trim().max(80).default(''), id: z.string().max(100).default(''), source: z.enum(['entry', 'post', 'provider', 'interest']).default('entry') }).parse(input))
  .handler(async ({ data, context }) => {
    const allowed = await context.supabase.rpc('account_allowed', { _uid: context.userId });
    if (allowed.error || !allowed.data) throw new Error('SIGN_IN_REQUIRED');
    let target: string | null = null;
    if (data.action === 'chat') {
      // Opening a chat only creates the private pair; it never rings a bell or sends a notice.
      const opened = await context.supabase.rpc('open_free_work_chat', { _id: data.id, _source: data.source, _section: data.section });
      if (opened.error) throw opened.error;
      return { target: opened.data };
    }
    if (data.action === 'join' || data.action === 'category') {
      const saved = await context.supabase.rpc('join_free_work', { _section: data.section, _category: data.category, _area: data.area });
      if (saved.error) throw saved.error;
      if (data.action === 'category') {
        const marked = await context.supabase.rpc('mark_free_work_category_bell', { _entry: saved.data });
        if (marked.error) throw marked.error;
        const opposite = { 'work-wanted': 'work-offered', 'work-offered': 'work-wanted', 'service-providers': 'service-wanted', 'service-wanted': 'service-providers' }[data.section];
        const rows = await context.supabase.rpc('list_free_work', { _section: opposite, _area: data.area, _category: data.category });
        if (rows.error) throw rows.error;
        for (const row of (rows.data ?? []).slice(0, 50)) {
          const result = await context.supabase.rpc('ring_free_work', { _id: row.id, _source: row.source, _section: opposite });
          if (result.error) throw result.error;
          target ??= result.data;
        }
      }
    } else {
      const result = await context.supabase.rpc('ring_free_work', { _id: data.id, _source: data.source, _section: data.section });
      if (result.error) throw result.error;
      target = result.data;
    }
    // The authenticated RPC above has already authorized and queued exact recipients.
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const dispatched = await supabaseAdmin.rpc('dispatch_free_work_notices');
    if (dispatched.error) throw dispatched.error;
    return { target };
  });