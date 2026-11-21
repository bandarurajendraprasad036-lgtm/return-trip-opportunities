import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useMe } from '@/lib/session';

const STATUS: Record<string, string> = { ok: 'సరిపోయింది ✓', not_matched: 'సరిపోలేదు', pending: 'చూడాలి' };

export function AdminAadhaarList() {
  const { data: me } = useMe();
  const { data = [] } = useQuery({ queryKey: ['admin-aadhaar'], enabled: !!me?.isAdmin, queryFn: async () => {
    const r = await supabase.from('aadhaar_checks').select('user_id,path,status,note,checked_at').order('checked_at', { ascending: false }).limit(200); if (r.error) throw r.error;
    const ids = r.data.map(x => x.user_id); const p = ids.length ? await supabase.from('profiles').select('id,full_name,phone').in('id', ids) : { data: [], error: null }; if (p.error) throw p.error;
    return r.data.map(x => ({ ...x, profile: p.data?.find(y => y.id === x.user_id) }));
  } });
  if (!me?.isAdmin) return null;
  const open = async (path: string) => { const r = await supabase.storage.from('aadhaar-cards').createSignedUrl(path, 120); if (r.error) { toast.error('ఆధార్ తెరవలేదు'); return; } window.open(r.data.signedUrl, '_blank', 'noopener'); };
  return <section className="space-y-2 rounded-xl border p-3" aria-label="ఆధార్ కార్డులు">
    <h2 className="text-xl font-bold">ఆధార్ కార్డులు <span translate="no">({data.length})</span></h2>
    {!data.length && <p>ఇంకా ఎవరూ ఆధార్ పెట్టలేదు</p>}
    {data.map(row => <div key={row.user_id} className="flex items-center justify-between gap-2 rounded-md border p-2">
      <span className="min-w-0 break-words" translate="no"><b>{row.profile?.full_name || row.profile?.phone || '—'}</b><span className="block text-sm">{row.profile?.phone}</span><span className="block text-sm">{STATUS[row.status] ?? row.status} · {row.note}</span></span>
      <Button variant="outline" onClick={() => void open(row.path)}>చూడండి</Button>
    </div>)}
  </section>;
}
