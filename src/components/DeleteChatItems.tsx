import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export function DeleteChatItems({ message, other, post }: { message?: string; other?: string; post?: string | undefined }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const label = message ? 'సందేశం తొలగించండి' : 'అన్ని సందేశాలు తొలగించండి';
  async function remove() {
    if (busy || !window.confirm(message ? 'ఈ సందేశాన్ని మీ ఖాతా నుంచి తొలగించాలా?' : 'ఈ సంభాషణలోని అన్ని సందేశాలను మీ ఖాతా నుంచి తొలగించాలా?')) return;
    setBusy(true);
    const result = await supabase.rpc('dismiss_chat_items', {
      _all: !message,
      ...(message ? { _message: message } : {}),
      ...(other ? { _other: other } : {}),
      ...(post ? { _post: post } : {}),
    });
    setBusy(false);
    if (result.error) { toast.error('తొలగించలేకపోయాం. మళ్లీ ప్రయత్నించండి'); return; }
    await qc.invalidateQueries();
    toast.success('మీ ఖాతా నుంచి తొలగించాం');
  }
  return <Button type="button" variant="ghost" size={message ? 'icon' : 'sm'} aria-label={label} title={label} disabled={busy} onClick={() => void remove()}><Trash2 />{!message && label}</Button>;
}