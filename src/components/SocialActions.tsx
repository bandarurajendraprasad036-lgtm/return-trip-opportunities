import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/session';
import { useLanguage } from '@/lib/language';
import { bellDateTime } from '@/lib/bell-details';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SocialActions({ postId, reelId }: { postId?: string; reelId?: string }) {
  const { data: me } = useMe();
  const language = useLanguage();
  const text = (te: string, en: string) => language === 'en' ? en : te;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const column = reelId ? 'reel_id' : 'post_id';
  const id = reelId ?? postId ?? '';
  const key = ['social', column, id];
  const likes = useQuery({ queryKey: [...key, 'likes', me?.id], queryFn: async () => {
    const total = await supabase.rpc('social_like_count', reelId ? { _reel: reelId } : { _post: id });
    if (total.error) throw total.error;
    const own = me ? await supabase.from('likes').select('id').eq(column, id).eq('user_id', me.id).maybeSingle() : null;
    if (own?.error) throw own.error;
    return { total: Number(total.data ?? 0), own: own?.data?.id };
  }});
  const comments = useQuery({ queryKey: [...key, 'comments'], enabled: open, queryFn: async () => {
    const { data, error } = await supabase.from('comments').select('id,user_id,body,created_at').eq(column, id).order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    return data ?? [];
  }});
  async function run(action: () => PromiseLike<{ error: unknown }>) {
    if (busy || !me || me.block) return;
    setBusy(true);
    try { const result = await action(); if (result.error) throw result.error; await qc.invalidateQueries({ queryKey: key }); }
    catch (error) { toast.error(error && typeof error === 'object' && 'message' in error && String(error.message).includes('BAD_CONTENT') ? text('చెడు మాటలు తీసేసి పంపండి.', 'Remove bad words and try again.') : text('పంపడం కుదరలేదు. మళ్ళీ ప్రయత్నించండి.', 'Could not save. Please try again.')); }
    finally { setBusy(false); }
  }
  return <div className="space-y-2 border-t pt-2">
    <div className="flex flex-wrap items-center gap-2">
      <Button variant={likes.data?.own ? 'default' : 'ghost'} title={text('ఇష్టం', 'Like')} aria-label={text('ఇష్టం', 'Like')} aria-pressed={!!likes.data?.own} disabled={!me || !!me.block || busy || likes.isPending || likes.isError} onClick={() => void run(() => likes.data?.own ? supabase.from('likes').delete().eq('id', likes.data.own) : supabase.from('likes').insert({ post_id: postId ?? null, reel_id: reelId ?? null }))}><Heart className="size-4" />{likes.data?.total ?? 0}</Button>
      <Button variant="ghost" aria-expanded={open} onClick={() => setOpen(!open)}><MessageCircle className="size-4" />{text('కామెంట్లు', 'Comments')}</Button>
      {!me && <Button asChild variant="link"><Link to="/auth">{text('లాగిన్', 'Log in')}</Link></Button>}
    </div>
    {likes.isError && <p className="text-sm text-destructive">{text('ఇష్టాలు రాలేదు.', 'Could not load likes.')}</p>}
    {open && <div className="space-y-3">
      {me && !me.block && <form className="flex gap-2" onSubmit={e => { e.preventDefault(); if (!body.trim()) return; void run(async () => { const result = await supabase.from('comments').insert({ user_id: me.id, post_id: postId ?? null, reel_id: reelId ?? null, body: body.trim() }); if (!result.error) setBody(''); return result; }); }}>
        <Input translate="no" aria-label={text('కామెంట్', 'Comment')} placeholder={text('మీ కామెంట్', 'Your comment')} maxLength={1000} value={body} onChange={e => setBody(e.target.value)} />
        <Button type="submit" size="icon" disabled={busy || !body.trim()} aria-label={text('పంపండి', 'Send')} title={text('పంపండి', 'Send')}><Send className="size-4" /></Button>
      </form>}
      {comments.isPending && <p>{text('వస్తున్నాయి…', 'Loading…')}</p>}
      {comments.isError && <Button variant="outline" onClick={() => void comments.refetch()}>{text('మళ్ళీ చూడండి', 'Try again')}</Button>}
      {comments.data?.length === 0 && <p className="text-sm text-muted-foreground">{text('ఇంకా కామెంట్లు లేవు.', 'No comments yet.')}</p>}
      {comments.data?.map(comment => <div key={comment.id} className="flex items-start gap-2 border-b pb-2">
        <div className="min-w-0 flex-1"><p translate="no" className="whitespace-pre-wrap break-words">{comment.body}</p><time translate="no" className="text-xs text-muted-foreground" dateTime={comment.created_at}>{bellDateTime(comment.created_at)}</time></div>
        {(me?.id === comment.user_id || me?.isAdmin) && <Button variant="ghost" size="icon" disabled={busy} title={text('తొలగించండి', 'Delete')} aria-label={text('కామెంట్ తొలగించండి', 'Delete comment')} onClick={() => void run(() => supabase.from('comments').delete().eq('id', comment.id))}><Trash2 className="size-4" /></Button>}
      </div>)}
    </div>}
  </div>;
}