import { useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/session';
import { useLanguage } from '@/lib/language';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ReelVideo } from '@/components/ReelVideo';
import { SocialActions } from '@/components/SocialActions';
import { bellDateTime } from '@/lib/bell-details';

export function ReelsFeed({ preview = false }: { preview?: boolean }) {
  const { data: me } = useMe();
  const language = useLanguage();
  const text = (te: string, en: string) => language === 'en' ? en : te;
  const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [adding, setAdding] = useState(false);
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(0);
  const reels = useQuery({ queryKey: ['reels', preview, page], queryFn: async () => {
    const { data, error } = await supabase.from('reels').select('*').eq('published', true).order('created_at', { ascending: false }).range(page * 12, page * 12 + (preview ? 1 : 11));
    if (error) throw error;
    return data ?? [];
  }});
  async function upload() {
    if (!me || me.block || !file || !consent || busy) return;
    if (!['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type) || file.size > 50 * 1024 * 1024) { toast.error(text('వీడియో 50 ఎంబీ లోపు ఉండాలి.', 'Choose an MP4, WebM or MOV video under 50 MB.')); return; }
    setBusy(true);
    const ext = file.type === 'video/webm' ? 'webm' : file.type === 'video/quicktime' ? 'mov' : 'mp4';
    const path = `${me.id}/${crypto.randomUUID()}.${ext}`;
    let uploaded = false;
    try {
      const media = await supabase.storage.from('reel-videos').upload(path, file, { contentType: file.type });
      if (media.error) throw media.error;
      uploaded = true;
      const result = await supabase.from('reels').insert({ user_id: me.id, caption: caption.trim(), video_path: path, published: true });
      if (result.error) throw result.error;
      setAdding(false); setCaption(''); setFile(null); setConsent(false); setPage(0);
      await qc.invalidateQueries({ queryKey: ['reels'] });
      toast.success(text('వీడియో పెట్టారు.', 'Video posted.'));
    } catch (error) { if (uploaded) await supabase.storage.from('reel-videos').remove([path]); toast.error(error && typeof error === 'object' && 'message' in error && String(error.message).includes('BAD_CONTENT') ? text('చెడు మాటలు తీసేసి పంపండి.', 'Remove bad words and try again.') : text('వీడియో పెట్టడం కుదరలేదు.', 'Could not post video.')); }
    finally { setBusy(false); }
  }
  return <section className="space-y-3 border-t py-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-bold">{text('చిన్న వీడియోలు', 'Reels')}</h2><div className="flex gap-1"><Button asChild variant="outline"><Link to="/reels-battle"><Trophy className="size-4" />{text('పోటీ', 'Battle')}</Link></Button>{!preview && me && !me.block && <Button variant="outline" onClick={() => setAdding(!adding)}><Plus className="size-4" />{text('వీడియో', 'Video')}</Button>}</div></div>
    {!preview && !me && <Button asChild variant="outline"><Link to="/auth">{text('లాగిన్', 'Log in')}</Link></Button>}
    {adding && <form className="space-y-3 border-b pb-4" onSubmit={e => { e.preventDefault(); void upload(); }}>
      <Input translate="no" value={caption} onChange={e => setCaption(e.target.value)} placeholder={text('వీడియో గురించి', 'Video caption')} aria-label={text('వీడియో గురించి', 'Video caption')} maxLength={500} disabled={busy} />
      <input ref={fileInput} type="file" accept="video/mp4,video/webm,video/quicktime" aria-label="Video file" disabled={busy} onChange={e => setFile(e.target.files?.[0] ?? null)} className="block w-full min-w-0 text-sm" />
      <label className="flex items-start gap-2"><Checkbox checked={consent} disabled={busy} onCheckedChange={v => setConsent(v === true)} /><span>{text('నా వీడియో అందరూ చూడవచ్చు.', 'Everyone can see my video.')}</span></label>
      <Button type="submit" disabled={busy || !file || !consent}>{busy ? text('పెడుతున్నాం…', 'Posting…') : text('పెట్టండి', 'Post video')}</Button>
    </form>}
    {reels.isPending && <p>{text('వస్తున్నాయి…', 'Loading…')}</p>}
    {reels.isError && <Button variant="outline" onClick={() => void reels.refetch()}>{text('మళ్ళీ చూడండి', 'Try again')}</Button>}
    {reels.data?.length === 0 && <p className="text-muted-foreground">{text('ఇంకా వీడియోలు లేవు.', 'No videos yet.')}</p>}
    {reels.data?.map(reel => <article key={reel.id} className="space-y-2 rounded-lg border bg-card p-3">
      <ReelVideo path={reel.video_path} caption={reel.caption || 'Video'} />
      <p translate="no" className="whitespace-pre-wrap break-words">{reel.caption}</p><time translate="no" dateTime={reel.created_at} className="text-xs text-muted-foreground">{bellDateTime(reel.created_at)}</time>
      <SocialActions reelId={reel.id} />
      {(me?.id === reel.user_id || me?.isAdmin) && <Button variant="ghost" size="icon" disabled={busy} title={text('తొలగించండి', 'Delete')} aria-label={text('వీడియో తొలగించండి', 'Delete video')} onClick={async () => { if (!window.confirm(text('వీడియో తొలగించాలా?', 'Delete this video?'))) return; setBusy(true); try { const result = await supabase.from('reels').delete().eq('id', reel.id); if (result.error) throw result.error; await supabase.storage.from('reel-videos').remove([reel.video_path]); await qc.invalidateQueries({ queryKey: ['reels'] }); await qc.invalidateQueries({ queryKey: ['battles'] }); } catch { toast.error(text('తొలగించడం కుదరలేదు.', 'Could not delete.')); } finally { setBusy(false); } }}><Trash2 className="size-4" /></Button>}
    </article>)}
    {preview ? <Button asChild variant="outline" className="w-full"><Link to="/reels">{text('అన్ని వీడియోలు', 'All reels')}</Link></Button> : <div className="flex justify-between"><Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>{text('ముందువి', 'Previous')}</Button><Button variant="outline" disabled={(reels.data?.length ?? 0) < 12} onClick={() => setPage(page + 1)}>{text('తరువాతవి', 'Next')}</Button></div>}
  </section>;
}