import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, Trash2, CircleCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

export function AdminAccountActions({ user, name }: { user: string; name: string }) {
  const [action, setAction] = useState<'block' | 'unblock' | 'remove' | null>(null);
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const status = useQuery({ queryKey: ['admin-account-block', user], refetchInterval: 5000, queryFn: async () => {
    const result = await supabase.from('account_blocks').select('reason').eq('user_id', user).maybeSingle();
    if (result.error) throw result.error;
    return result.data;
  } });
  async function confirm() {
    if (!action || busy) return;
    setBusy(true);
    try {
      // Self-authorizing database action: works on every website address.
      if (action === 'unblock') {
        const result = await supabase.rpc('admin_unblock_account', { _user: user });
        if (result.error) throw result.error;
        if (!result.data) throw new Error('ACTION_NOT_CONFIRMED');
      } else {
        const result = await supabase.rpc('admin_manage_account', { _user: user, _action: action });
        if (result.error) throw result.error;
        if (result.data !== action) throw new Error('ACTION_NOT_CONFIRMED');
      }
      toast.success(action === 'unblock' ? 'ఖాతాను తిరిగి అనుమతించారు.' : action === 'block' ? 'ఖాతాను నిలిపివేశారు.' : 'ఖాతా, దాని వివరాలు తొలగించారు.');
      setAction(null);
      await qc.invalidateQueries();
    } catch (error) { const text = error instanceof Error ? error.message : String((error as { message?: string })?.message ?? ''); toast.error(text.includes('ADMIN_PROTECTED') ? 'ఇది నిర్వాహక ఖాతా; దీన్ని మార్చలేరు.' : text.includes('ACCOUNT_UNAVAILABLE') ? 'ఈ ఖాతా ఇప్పటికే లేదు.' : 'చర్య పూర్తి కాలేదు; మళ్లీ ప్రయత్నించండి.'); }
    finally { setBusy(false); }
  }
  return <><p role="status">{status.isError ? 'ఖాతా స్థితి రాలేదు' : status.isPending ? 'వేచి ఉండండి…' : status.data ? 'ఖాతా నిలిపివేశారు' : 'ఖాతా ఉపయోగించవచ్చు'}</p><div className="flex flex-wrap gap-2 border-t pt-3"><Button variant="outline" disabled={status.isPending || status.isError} onClick={()=>setAction(status.data ? 'unblock' : 'block')}>{status.data ? <CircleCheck /> : <Ban />}{status.data ? 'తిరిగి అనుమతించండి' : 'నిలిపివేయండి'}</Button><Button variant="destructive" onClick={()=>setAction('remove')}><Trash2 />తొలగించండి</Button></div>
    <Dialog open={action !== null} onOpenChange={open=>{if(!open && !busy)setAction(null);}}><DialogContent aria-describedby={undefined}><DialogTitle>{action === 'remove' ? 'ఈ ఖాతాను పూర్తిగా తొలగించాలా?' : action === 'unblock' ? 'ఈ ఖాతాను తిరిగి అనుమతించాలా?' : 'ఈ ఖాతాను నిలిపివేయాలా?'}</DialogTitle><p translate="no" className="break-words">{name || user}</p><p>{action === 'remove' ? 'ఈ ఖాతా వివరాలు, ప్రకటనలు, చెల్లింపులు, చిత్రాలు, సంభాషణలు పోతాయి. తిరిగి పొందలేరు.' : action === 'unblock' ? 'ఈ వ్యక్తి మళ్లీ ప్రవేశించి, అనుమతించిన సేవలు ఉపయోగించవచ్చు.' : 'ఈ వ్యక్తి ఇక ప్రవేశించలేరు; ఇప్పటికే తెరిచిన ఖాతాను కూడా ఉపయోగించలేరు.'}</p><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy} onClick={()=>setAction(null)}>వద్దు</Button><Button variant="destructive" disabled={busy} onClick={()=>void confirm()}>{busy ? 'చేస్తున్నాం…' : 'అవును, నిర్ధారిస్తున్నాను'}</Button></div></DialogContent></Dialog></>;
}