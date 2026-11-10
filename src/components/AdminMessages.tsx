import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { ImagePlus, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/session';
import { viewChatImage } from '@/lib/chat-upload.functions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

export function AdminMessages() {
  const { data: me } = useMe();
  const showImage = useServerFn(viewChatImage);
  const [imageUrl, setImageUrl] = useState('');
  const [imageError, setImageError] = useState('');
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['admin-messages', me?.id],
    enabled: !!me?.isAdmin,
    queryFn: async () => {
      const result = await supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(300);
      if (result.error) throw result.error;
      const ids = [...new Set((result.data ?? []).flatMap(message => [message.sender_id, message.receiver_id]))];
      const people = ids.length ? await supabase.from('profiles').select('id,full_name,phone').in('id', ids) : { data: [], error: null };
      if (people.error) throw people.error;
      return { messages: result.data ?? [], people: people.data ?? [] };
    },
  });
  const person = (id: string) => {
    const profile = data?.people.find(row => row.id === id);
    return profile ? `${profile.full_name || 'పేరు లేదు'} · ${profile.phone || 'నంబరు లేదు'}` : 'సభ్యుడు · Member';
  };
  return <section className="space-y-3 rounded-xl border bg-card p-3" aria-labelledby="admin-messages-title">
    <h3 id="admin-messages-title" className="text-xl font-bold">అన్ని సంభాషణలు, చిత్రాలు · All chats and images</h3>
    {isPending && <p role="status">సంభాషణలు వస్తున్నాయి · Loading chats</p>}
    {isError && <div role="alert" className="space-y-2"><p>సంభాషణలు రాలేదు · Could not load chats</p><Button variant="outline" onClick={() => void refetch()}>మళ్లీ ప్రయత్నించండి · Retry</Button></div>}
    {!isPending && !isError && data?.messages.length === 0 && <p>ఇంకా సంభాషణలు లేవు · No chats yet</p>}
    <div className="space-y-2">{data?.messages.map(message => {
      const other = message.sender_id === me?.id ? message.receiver_id : message.sender_id;
      return <article key={message.id} className="space-y-2 rounded-lg border p-3 text-sm">
        <p className="break-words font-bold">{person(message.sender_id)} → {person(message.receiver_id)}</p>
        <p className="whitespace-pre-wrap break-words">{message.body || 'చిత్రం మాత్రమే · Image only'}</p>
        <p className="text-xs text-muted-foreground">{new Date(message.created_at).toLocaleString('te-IN')}</p>
        <div className="flex flex-wrap gap-2">
          {message.image_path && <Button type="button" variant="outline" onClick={async () => { setImageError(''); try { const result = await showImage({ data: { message: message.id } }); setImageUrl(result.url); } catch { setImageError('చిత్రం తెరవలేకపోయాం · Image unavailable'); } }}><ImagePlus />చిత్రం · Image</Button>}
          <Button asChild variant="outline"><Link to="/chat/$userId" params={{ userId: other }} search={{ post: message.post_id ?? undefined }}><MessageCircle />సంభాషణ · Open</Link></Button>
        </div>
      </article>;
    })}</div>
    {imageError && <p role="alert" className="text-destructive">{imageError}</p>}
    <Dialog open={!!imageUrl} onOpenChange={open => { if (!open) setImageUrl(''); }}><DialogContent><DialogTitle>వ్యక్తిగత చిత్రం · Private image</DialogTitle>{imageUrl && <img src={imageUrl} alt="సంభాషణ చిత్రం · Chat image" className="max-h-[70svh] w-full object-contain" />}</DialogContent></Dialog>
  </section>;
}
