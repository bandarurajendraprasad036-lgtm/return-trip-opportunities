import { supabase } from '@/integrations/supabase/client';
import { FREE_WORK_SECTIONS, type FreeWorkSection } from './free-work';
import { enableBellAudio, playBell } from './bell';

// Browser-side free work actions: each RPC authorizes the signed-in caller itself (RLS/SECURITY DEFINER),
// so these work on any hosting. Queued notices are delivered by the managed minute dispatcher.
export type FreeWorkInput = { section: FreeWorkSection; action: 'join' | 'ring' | 'category' | 'chat'; category?: string; area?: string; id?: string; source?: 'entry' | 'post' | 'provider' | 'interest' };
const OPPOSITE: Record<FreeWorkSection, FreeWorkSection> = { 'work-wanted': 'work-offered', 'work-offered': 'work-wanted', 'service-providers': 'service-wanted', 'service-wanted': 'service-providers' };
export async function freeWorkClientAction({ data: input }: { data: FreeWorkInput }): Promise<{ target: string | null; rung?: number }> {
  if (input.action === 'ring' || input.action === 'category') enableBellAudio();
  if (!(FREE_WORK_SECTIONS as readonly string[]).includes(input.section)) throw new Error('INVALID_SECTION');
  const data = { section: input.section, action: input.action, category: (input.category ?? '').trim().slice(0, 40), area: (input.area ?? '').trim().slice(0, 80), id: (input.id ?? '').slice(0, 100), source: input.source ?? 'entry' };
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('SIGN_IN_REQUIRED');
  const allowed = await supabase.rpc('account_allowed', { _uid: auth.user.id });
  if (allowed.error || !allowed.data) throw new Error('SIGN_IN_REQUIRED');
  if (data.action === 'chat') {
    // Opening a chat only creates the private pair; it never rings a bell or sends a notice.
    const opened = await supabase.rpc('open_free_work_chat', { _id: data.id, _source: data.source, _section: data.section });
    if (opened.error) throw opened.error;
    return { target: opened.data };
  }
  let target: string | null = null;
  let rung = 0;
  if (data.action === 'join' || data.action === 'category') {
    const saved = await supabase.rpc('join_free_work', { _section: data.section, _category: data.category, _area: data.area });
    if (saved.error) throw saved.error;
    if (data.action === 'category') {
      const marked = await supabase.rpc('mark_free_work_category_bell', { _entry: saved.data });
      if (marked.error) throw marked.error;
      const opposite = OPPOSITE[data.section];
      const rows = await supabase.rpc('list_free_work', { _section: opposite, _area: data.area, _category: data.category });
      if (rows.error) throw rows.error;
      for (const row of (rows.data ?? []).slice(0, 50)) {
        const result = await supabase.rpc('ring_free_work', { _id: row.id, _source: row.source, _section: opposite });
        if (result.error) throw result.error;
        target ??= result.data;
        rung++;
      }
    }
    if (data.action === 'category') playBell();
    return { target, rung };
  }
  const result = await supabase.rpc('ring_free_work', { _id: data.id, _source: data.source, _section: data.section });
  if (result.error) throw result.error;
  if (result.data) playBell();
  return { target: result.data, rung: 1 };
}
