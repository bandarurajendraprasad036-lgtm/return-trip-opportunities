import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/session';
import { MIN_PROVIDER_CONTACTS, validProviderContacts, type ProviderContactInput } from '@/lib/current-membership';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
const empty = (): ProviderContactInput => ({ town: '', service: '', mobile: '', consent: false });
export function ProviderContacts({ admin = false }: { admin?: boolean }) {
  const { data: me } = useMe(); const qc = useQueryClient();
  const [rows, setRows] = useState<ProviderContactInput[]>([empty()]); const [busy, setBusy] = useState(false);
  const batches = useQuery({ queryKey: ['provider-contact-batches', me?.id, admin], enabled: Boolean(me), queryFn: async () => {
    let query = supabase.from('provider_contact_batches').select('*').order('created_at', { ascending: false });
    if (!admin && me) query = query.eq('user_id', me.id);
    const result = await query; if (result.error) throw result.error; return result.data;
  } });
  const contacts = useQuery({ queryKey: ['provider-contacts', me?.id, admin], enabled: Boolean(me && admin), queryFn: async () => {
    const result = await supabase.from('provider_contacts').select('*'); if (result.error) throw result.error; return result.data;
  } });
  if (!me || (admin && !me.isAdmin)) return null;
  const update = (index: number, key: keyof ProviderContactInput, value: string | boolean) => setRows(old => old.map((r, i) => i === index ? { ...r, [key]: value } : r));
  return <section className="space-y-3 border-y py-4">
    <h2 className="text-xl font-bold">{admin ? 'సేవా నంబర్ల పరిశీలన · Contact review' : 'మీకు తెలిసిన సేవ అందించేవారు · Known service providers'}</h2>
    {!admin && <>
      <p>కనీసం 20 వేర్వేరు నిజమైన నంబర్లు ఇవ్వండి. నిర్వాహకుడు పరిశీలించి ఆమోదించిన తరువాత ₹49కు సభ్యత్వ చెల్లింపు చేయవచ్చు.</p>
      <p className="text-sm">మీరు ఇచ్చిన నెంబర్లు ఒరిజినల్ కానీ పక్షంలో మీరు పూర్తి అమౌంట్ కట్టాల్సి ఉంటుంది. వారి అనుమతితోనే ఇవ్వండి; ఈ నంబర్లు ప్రజలకు కనిపించవు.</p>
      {rows.map((r, i) => <div key={i} className="space-y-2 border-b pb-3">
        <div className="grid grid-cols-3 gap-1">
          <Input aria-label={`ఊరి పేరు ${i + 1}`} className="min-w-0 bg-job px-1 text-sm" placeholder="ఊరి పేరు" value={r.town} maxLength={80} onChange={e => update(i, 'town', e.target.value)} />
          <Input aria-label={`సేవ ${i + 1}`} className="min-w-0 bg-vehicle px-1 text-sm" list="provider-services" placeholder="సేవ" value={r.service} maxLength={100} onChange={e => update(i, 'service', e.target.value)} />
          <Input aria-label={`మొబైల్ ${i + 1}`} className="min-w-0 px-1 text-sm" inputMode="numeric" placeholder="మొబైల్" value={r.mobile} maxLength={10} onChange={e => update(i, 'mobile', e.target.value.replace(/\D/g, '').slice(0, 10))} />
        </div>
        <div className="flex items-center justify-between gap-2"><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={r.consent} onChange={e => update(i, 'consent', e.target.checked)} />ఈ వ్యక్తి నంబరు ఇవ్వడానికి అనుమతి ఉంది</label><Button variant="ghost" size="icon" aria-label={`తొలగించండి ${i + 1}`} disabled={rows.length === 1} onClick={() => setRows(old => old.filter((_, j) => i !== j))}><Trash2 /></Button></div>
      </div>)}
      <datalist id="provider-services"><option value="ఎలక్ట్రిషియన్" /><option value="ప్లంబర్" /><option value="టెక్నీషియన్" /></datalist>
      <p>{rows.length} / కనీసం {MIN_PROVIDER_CONTACTS}</p>
      <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={rows.length >= 500 || busy} onClick={() => setRows(old => [...old, empty()])}><Plus />మరొకరిని జోడించండి · Add</Button><Button disabled={busy || !validProviderContacts(rows)} onClick={async () => { setBusy(true); try { const result = await supabase.rpc('submit_provider_contacts', { _rows: rows }); if (result.error) throw result.error; setRows([empty()]); await qc.invalidateQueries({ queryKey: ['provider-contact-batches'] }); toast.success('నంబర్లు పరిశీలనకు పంపాం; ఆమోదం ఇంకా కాలేదు'); } catch { toast.error('నంబర్లు భద్రపడలేదు; పునరావృత నంబర్లు, అనుమతి పరిశీలించండి'); } finally { setBusy(false); } }}>పరిశీలనకు పంపండి · Submit</Button></div>
    </>}
    {batches.isError && <Button variant="outline" onClick={() => void batches.refetch()}>మళ్లీ ప్రయత్నించండి</Button>}
    {batches.data?.map(b => <article className="space-y-2 border-b py-3" key={b.id}><p>{b.status === 'approved' ? 'ఆమోదం: ₹49 చెల్లింపు అర్హత' : b.status === 'rejected' ? 'ఆమోదించలేదు; పూర్తి ₹100 చెల్లింపు' : 'పరిశీలనలో ఉంది'}</p>{b.review_note && <p>{b.review_note}</p>}{admin && <><p className="break-all text-xs">{b.user_id}</p>{contacts.data?.filter(c => c.batch_id === b.id).map(c => <p className="break-words text-sm" key={c.id}>{c.town} · {c.service} · {c.mobile}</p>)}{b.status === 'pending' && <div className="flex gap-2">{[true, false].map(approve => <Button key={String(approve)} variant="outline" disabled={busy || !contacts.data} onClick={async () => { if (approve && !window.confirm('కనీసం 20 నిజమైన, అనుమతితో ఇచ్చిన నంబర్లు పరిశీలించారా?')) return; setBusy(true); const result = await supabase.rpc('review_provider_contacts', { _id: b.id, _approve: approve, _note: approve ? 'నంబర్లు పరిశీలించి ఆమోదించాం' : 'నంబర్ల అర్హత నిర్ధారణ కాలేదు' }); setBusy(false); if (result.error) toast.error('నిర్ణయం నమోదు కాలేదు'); else await qc.invalidateQueries(); }}>{approve ? 'ఆమోదించు' : 'తిరస్కరించు'}</Button>)}</div>}</>}</article>)}
  </section>;
}