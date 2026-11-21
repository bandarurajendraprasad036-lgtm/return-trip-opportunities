import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/session';
import { checkAadhaar } from '@/lib/aadhaar.functions';

const STATUS: Record<string, string> = { ok: 'సరిపోయింది ✓', not_matched: 'సరిపోలేదు', pending: 'అడ్మిన్ చూస్తారు' };

// Private Aadhaar picture: only the member and admin can open it (storage rules).
export function AadhaarBox() {
  const { data: me } = useMe(); const qc = useQueryClient(); const input = useRef<HTMLInputElement>(null); const [busy, setBusy] = useState(false);
  const check = useServerFn(checkAadhaar);
  const { data: row } = useQuery({ queryKey: ['aadhaar', me?.id], enabled: !!me, queryFn: async () => { const r = await supabase.from('aadhaar_checks').select('path,status,note').eq('user_id', me?.id ?? '').maybeSingle(); if (r.error) throw r.error; return r.data; } });
  const { data: url } = useQuery({ queryKey: ['aadhaar-url', row?.path], enabled: !!row?.path, queryFn: async () => { const r = await supabase.storage.from('aadhaar-cards').createSignedUrl(row?.path ?? '', 600); if (r.error) throw r.error; return r.data.signedUrl; } });
  if (!me?.profile) return null;
  const upload = async (file: File | undefined) => {
    if (!file || busy) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { toast.error('ఆధార్ ఫోటో 5MB లోపు JPG / PNG ఉండాలి'); return; }
    setBusy(true);
    try {
      const path = `${me.id}/${crypto.randomUUID()}.${file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'}`;
      const up = await supabase.storage.from('aadhaar-cards').upload(path, file, { contentType: file.type });
      if (up.error) throw up.error;
      const result = await check({ data: { path } });
      if (row?.path && row.path !== path) await supabase.storage.from('aadhaar-cards').remove([row.path]);
      await qc.invalidateQueries({ queryKey: ['aadhaar'] });
      if (result.status === 'ok') toast.success('ఆధార్ పేరు సరిపోయింది'); else if (result.status === 'pending') toast.info('ఆధార్ పెట్టారు; అడ్మిన్ చూస్తారు'); else toast.error('ఆధార్ పేరు మీ ప్రొఫైల్ పేరుతో సరిపోలేదు');
    } catch { toast.error('ఆధార్ పెట్టలేదు; మళ్లీ ప్రయత్నించండి'); }
    finally { setBusy(false); if (input.current) input.current.value = ''; }
  };
  return <section data-subscription-exempt className="space-y-2 rounded-xl border p-3" aria-label="ఆధార్ కార్డు">
    <h3 className="text-lg font-bold">ఆధార్ కార్డు</h3>
    <button type="button" disabled={busy} onClick={() => input.current?.click()} aria-label={row ? 'ఆధార్ మార్చండి' : 'ఆధార్ పెట్టండి'} className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-primary bg-card">
      {url ? <img src={url} alt="మీ ఆధార్ కార్డు" className="h-full w-full object-contain" /> : <Plus className="size-12 text-primary" />}
      {url && <span className="absolute bottom-1 right-1 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground"><Plus className="size-5" /></span>}
    </button>
    {busy ? <p role="status">ఆధార్ చూస్తున్నాం…</p> : row ? <p role="status" className="font-semibold">స్థితి: {STATUS[row.status] ?? row.status} · {row.note}</p> : <p className="text-sm">+ నొక్కి ఆధార్ కార్డు ఫోటో పెట్టండి. ఇది మీకు, అడ్మిన్‌కు మాత్రమే కనబడుతుంది.</p>}
    <input ref={input} type="file" accept="image/*" className="hidden" onChange={e => void upload(e.target.files?.[0])} />
  </section>;
}
