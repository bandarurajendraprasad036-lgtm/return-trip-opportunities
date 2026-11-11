import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';

export type WeeklyWinner = { week_start: string; region: 'TG' | 'AP'; display_name: string; joins: number; paid: number; percent: number; user_id: string; photo: string };
/** Latest Telangana/Andhra winners; photos are signed only when stored as a selected winner photo. */
export const getWeeklyWinners = createServerFn({ method: 'GET' }).handler(async (): Promise<WeeklyWinner[]> => {
  const key = process.env['SUPABASE_PUBLISHABLE_KEY']; const url = process.env['SUPABASE_URL'];
  if (!key || !url) return [];
  const client = createClient(url, key, { auth: { persistSession: false }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers);
    if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
    headers.set('apikey', key); return fetch(input, { ...init, headers });
  } } });
  const result = await client.from('weekly_winners').select('week_start,region,display_name,joins,paid,percent,user_id,photo_path').order('week_start', { ascending: false }).limit(2);
  if (result.error || !result.data?.length) return [];
  const latest = result.data[0]!.week_start;
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  return Promise.all(result.data.filter(r => r.week_start === latest).map(async r => {
    const signed = await supabaseAdmin.storage.from('service-photos').createSignedUrl(r.photo_path, 600);
    return { week_start: r.week_start, region: r.region as 'TG' | 'AP', display_name: r.display_name, joins: r.joins, paid: r.paid, percent: Number(r.percent), user_id: r.user_id, photo: signed.data?.signedUrl.replace(url, import.meta.env['VITE_SUPABASE_URL']) ?? '' };
  }));
});
