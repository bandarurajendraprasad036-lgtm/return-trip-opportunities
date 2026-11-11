import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';

export type ReferralBoardData = { limit: number; event_label: string; totals: { TG: number; AP: number }; rows: { rank: number; count: number; name: string; region: string; photo_path: string; photo: string }[] };
export const getReferralBoard = createServerFn({ method: 'GET' }).handler(async () => {
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  const url = process.env['SUPABASE_URL'];
  if (!key || !url) throw new Error('పట్టిక తెరుచుకోలేదు');
  const client = createClient(url, key, { auth: { persistSession: false }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers);
    if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
    headers.set('apikey', key); return fetch(input, { ...init, headers });
  } } });
  const result = await client.rpc('public_referral_vip_board');
  if (result.error) throw new Error('పట్టిక తెరుచుకోలేదు');
  const board = result.data as ReferralBoardData;
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  return { ...board, rows: await Promise.all(board.rows.map(async row => {
    if (!row.photo_path) return { ...row, photo: '' };
    // Only the consent-checked public projection may authorize image signing.
    const signed = await supabaseAdmin.storage.from('service-photos').createSignedUrl(row.photo_path, 120);
    return { ...row, photo_path: '', photo: signed.data?.signedUrl.replace(url, import.meta.env['VITE_SUPABASE_URL']) ?? '' };
  })) };
});