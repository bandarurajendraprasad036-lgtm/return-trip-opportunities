import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Ban, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

export function AdminAccountActions({ user, name }: { user: string; name: string }) {
  const [action, setAction] = useState<'block' | 'remove' | null>(null);
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  async function confirm() {
    if (!action || busy) return;
    setBusy(true);
    try {
      // Self-authorizing database action: works on every website address.
      const result = await supabase.rpc('admin_manage_account', { _user: user, _action: action });
      if (result.error) throw result.error;
      if (result.data !== action) throw new Error('ACTION_NOT_CONFIRMED');
      toast.success(action === 'block' ? 'ఖాతాను నిలిపివేశారు.' : 'ఖాతా, దాని వివరాలు తొలగించారు.');
      setAction(null);
      await qc.invalidateQueries();
    } catch (error) { const text = error instanceof Error ? error.message : String((error as { message?: string })?.message ?? ''); toast.error(text.includes('ADMIN_PROTECTED') ? 'ఇది నిర్వాహక ఖాతా; దీన్ని మార్చలేరు.' : text.includes('ACCOUNT_UNAVAILABLE') ? 'ఈ ఖాతా ఇప్పటికే లేదు.' : 'చర్య పూర్తి కాలేదు; మళ్లీ ప్రయత్నించండి.'); }
    finally { setBusy(false); }
  }
  return <><div className="flex flex-wrap gap-2 border-t pt-3"><Button variant="outline" onClick={()=>setAction('block')}><Ban />నిలిపివేయండి</Button><Button variant="destructive" onClick={()=>setAction('remove')}><Trash2 />తొలగించండి</Button></div>
    <Dialog open={action !== null} onOpenChange={open=>{if(!open && !busy)setAction(null);}}><DialogContent aria-describedby={undefined}><DialogTitle>{action === 'remove' ? 'ఈ ఖాతాను పూర్తిగా తొలగించాలా?' : 'ఈ ఖాతాను నిలిపివేయాలా?'}</DialogTitle><p translate="no" className="break-words">{name || user}</p><p>{action === 'remove' ? 'ఈ ఖాతా వివరాలు, ప్రకటనలు, చెల్లింపులు, చిత్రాలు, సంభాషణలు పోతాయి. తిరిగి పొందలేరు.' : 'ఈ వ్యక్తి ఇక ప్రవేశించలేరు; ఇప్పటికే తెరిచిన ఖాతాను కూడా ఉపయోగించలేరు.'}</p><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy} onClick={()=>setAction(null)}>వద్దు</Button><Button variant="destructive" disabled={busy} onClick={()=>void confirm()}>{busy ? 'చేస్తున్నాం…' : 'అవును, నిర్ధారిస్తున్నాను'}</Button></div></DialogContent></Dialog></>;
}