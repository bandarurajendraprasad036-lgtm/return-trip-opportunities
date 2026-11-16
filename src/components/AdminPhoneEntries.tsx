import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Phone, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export function AdminPhoneEntries() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState('');
  const [accounts, setAccounts] = useState<Record<string, string>>({});
  const rows = useQuery({ queryKey: ['admin-phone-entries'], queryFn: async () => {
    const { data, error } = await supabase.from('phone_entry_requests').select('id,phone,created_at').eq('status', 'pending').order('created_at');
    if (error) throw error;
    return data;
  } });
  async function review(id: string, approve: boolean) {
    if (busy) return;
    setBusy(id);
    try {
      const account = accounts[id]?.trim();
      if (account && !/^[a-f0-9-]{36}$/i.test(account)) { toast.error('సరైన పాత ఖాతా గుర్తింపు ఇవ్వండి'); return; }
      const result = await supabase.rpc('review_phone_entry', { _id: id, _approve: approve, ...(account ? { _account: account } : {}) });
      if (result.error) throw result.error;
      await qc.invalidateQueries({ queryKey: ['admin-phone-entries'] });
      toast.success(approve ? 'ఈ పరికరానికి ప్రవేశ అనుమతి ఇచ్చారు' : 'అభ్యర్థన తిరస్కరించారు');
    } catch { toast.error('అనుమతి నమోదు కాలేదు; ఖాతా నంబరు సరిచూడండి'); } finally { setBusy(''); }
  }
  return <section className="space-y-3 border-y py-4"><h2 className="text-xl font-bold">ఫోన్‌లో పరిశీలించాల్సిన ప్రవేశ అభ్యర్థనలు</h2>
    {rows.isError && <p role="alert">అభ్యర్థనలు రాలేదు</p>}
    {rows.isPending && <p role="status">చూస్తున్నాం…</p>}
    {rows.data?.length === 0 && <p>కొత్త అభ్యర్థనలు లేవు</p>}
    {rows.data?.map(row => <article key={row.id} className="space-y-3 rounded-lg border p-3"><Button asChild variant="outline"><a href={`tel:+91${row.phone}`}><Phone /><span translate="no">{row.phone}</span></a></Button>
      <ExistingPhoneAccount phone={row.phone} selected={accounts[row.id] ?? ''} onSelect={account => setAccounts({ ...accounts, [row.id]: account })} />
      <div className="flex flex-wrap gap-2"><Button className="h-auto whitespace-normal" disabled={!!busy} onClick={() => void review(row.id, true)}><Check />ఫోన్‌లో పరిశీలించాను — అనుమతి ఇవ్వండి</Button><Button variant="outline" disabled={!!busy} onClick={() => void review(row.id, false)}><X />తిరస్కరించండి</Button></div></article>)}
  </section>;
}

function ExistingPhoneAccount({ phone, selected, onSelect }: { phone: string; selected: string; onSelect: (id: string) => void }) {
  const matches = useQuery({ queryKey: ['admin-phone-account', phone], queryFn: async () => {
    const result = await supabase.from('profiles').select('id,full_name,phone').eq('phone', phone);
    if (result.error) throw result.error;
    return result.data;
  } });
  return <div className="space-y-2"><Button variant={selected ? 'outline' : 'default'} onClick={() => onSelect('')}>కొత్త ప్రత్యేక ఖాతా</Button>
    {matches.isError && <p role="alert">పాత ఖాతా వివరాలు రాలేదు; అనుమతి ఇచ్చేముందు మళ్లీ చూడండి.</p>}
    {matches.data?.map(account => <Button key={account.id} className="h-auto w-full whitespace-normal" variant={selected === account.id ? 'default' : 'outline'} onClick={() => onSelect(account.id)}>పరిశీలించిన పాత ఖాతా: <span translate="no">{account.full_name || account.id}</span></Button>)}
  </div>;
}