import { useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { ImagePlus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/session';
import { sendChatEntry } from '@/lib/chat-upload.functions';
import { CHAT_IMAGE_LIMIT } from '@/lib/chat-rules';
import { Button } from '@/components/ui/button';

export function HomeAdminChat() {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const sendEntry = useServerFn(sendChatEntry);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const choose = () => {
    if (!me) { void navigate({ to: '/auth' }); return; }
    input.current?.click();
  };
  const upload = async (file: File | undefined) => {
    if (!file || !me || busy) return;
    if (file.size > CHAT_IMAGE_LIMIT || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setStatus('ఐదు మెగాబైట్ల లోపు చిత్రం ఎంచుకోండి · Choose an image under 5MB'); return;
    }
    setBusy(true); setStatus('');
    try {
      const admin = await supabase.rpc('support_admin_id');
      if (admin.error || !admin.data) throw new Error('Admin unavailable');
      const form = new FormData();
      form.set('receiver', admin.data); form.set('post', ''); form.set('body', ''); form.set('phone', ''); form.set('image', file);
      await sendEntry({ data: form });
      setStatus('చిత్రం అడ్మిన్‌కు భద్రపడింది · Image saved to admin chat');
      if (input.current) input.current.value = '';
    } catch { setStatus('చిత్రం పంపలేకపోయాం. మళ్లీ ప్రయత్నించండి · Image not sent'); }
    finally { setBusy(false); }
  };
  return <div className="home-quick-box">
    <Button type="button" variant="ghost" className="h-auto min-h-12 flex-1 whitespace-normal px-1" disabled={busy} onClick={() => void navigate({ to: me ? '/chats' : '/auth' })}>అడ్మిన్‌తో చాట్<span className="block text-xs">Chat with Admin</span></Button>
    <Button type="button" variant="outline" size="icon" className="size-12 shrink-0" aria-label="అడ్మిన్‌కు చిత్రం పంపండి · Send image to admin" disabled={busy} onClick={choose}><ImagePlus /></Button>
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={event => void upload(event.target.files?.[0])} />
    {status && <p role="status" className="col-span-2 break-words text-xs">{status}</p>}
  </div>;
}
