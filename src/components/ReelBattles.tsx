import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/session';
import { useLanguage } from '@/lib/language';
import { bellDateTime } from '@/lib/bell-details';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ReelVideo } from '@/components/ReelVideo';

type Battle = Database['public']['Tables']['reels_battle']['Row'];
function BattleRow({ battle }: { battle: Battle }) {
  const { data: me } = useMe();
  const language = useLanguage();
  const text = (te: string, en: string) => language === 'en' ? en : te;
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const ended = Date.parse(battle.ends_at) <= now;
  const state = useQuery({ queryKey: ['battle-state', battle.id, me?.id], refetchInterval: 15000, queryFn: async () => {
    const [reels, results, own] = await Promise.all([
      supabase.from('reels').select('*').in('id', [battle.reel_a, battle.reel_b]).eq('published', true),
      supabase.rpc('reel_battle_results', { _battle: battle.id }),
      me ? supabase.from('reel_battle_votes').select('reel_id').eq('battle_id', battle.id).eq('user_id', me.id).maybeSingle() : Promise.resolve(null),
    ]);
    if (reels.error || results.error || own?.error) throw reels.error || results.error || own?.error;
    return { reels: reels.data ?? [], results: results.data ?? [], voted: own?.data?.reel_id };
  }});
  const sorted = [...(state.data?.results ?? [])].sort((a, b) => Number(b.votes) - Number(a.votes));
  const winner = sorted[0] && sorted[1] && Number(sorted[0].votes) !== Number(sorted[1].votes) ? sorted[0].reel_id : null;
  return <article className="space-y-3 rounded-lg border bg-card p-3">
    <h2 translate="no" className="break-words text-lg font-bold">{battle.title}</h2>
    <p className="text-sm">{ended ? text('పోటీ ముగిసింది', 'Battle ended') : text('ముగిసే సమయం', 'Closes')} · <time translate="no" dateTime={battle.ends_at}>{bellDateTime(battle.ends_at)}</time></p>
    {state.isPending && <p>{text('వస్తున్నాయి…', 'Loading…')}</p>}
    {state.isError && <Button variant="outline" onClick={() => void state.refetch()}>{text('మళ్ళీ చూడండి', 'Try again')}</Button>}
    {state.data?.reels.map((reel, i) => <div key={reel.id} className="space-y-2 border-t pt-3">
      <ReelVideo path={reel.video_path} caption={reel.caption || 'Video'} /><p translate="no" className="break-words">{reel.caption}</p>
      <div className="flex flex-wrap items-center justify-between gap-2"><span>{Number(state.data?.results.find(row => row.reel_id === reel.id)?.votes ?? 0)} {text('ఓట్లు', 'votes')}{ended && winner === reel.id && <Trophy className="ml-2 inline size-4 text-primary" />}</span>
        <Button variant={state.data?.voted === reel.id ? 'default' : 'outline'} aria-label={`${text('ఓటు', 'Vote')} ${i + 1}`} disabled={!me || !!me.block || ended || busy || !!state.data?.voted} onClick={async () => {
          if (!me || busy) return; setBusy(true);
          try { const { error } = await supabase.from('reel_battle_votes').insert({ battle_id: battle.id, reel_id: reel.id, user_id: me.id }); if (error) throw error; await qc.invalidateQueries({ queryKey: ['battle-state', battle.id] }); toast.success(text('ఓటు వేశారు.', 'Vote saved.')); }
          catch { toast.error(text('ఓటు వేయడం కుదరలేదు. మళ్ళీ చూడండి.', 'Could not vote. Refresh and try again.')); await state.refetch(); }
          finally { setBusy(false); }
        }}>{state.data?.voted === reel.id ? text('మీ ఓటు', 'Your vote') : text('ఓటు', 'Vote')}</Button>
      </div>
    </div>)}
    {ended && state.data && !winner && <p>{text('రెండింటికీ సమాన ఓట్లు.', 'The vote is tied.')}</p>}
    {!me && <Button asChild variant="link"><Link to="/auth">{text('ఓటు వేయడానికి లాగిన్', 'Log in to vote')}</Link></Button>}
    {(me?.id === battle.user_id || me?.isAdmin) && <Button variant="ghost" size="icon" disabled={busy} aria-label={text('పోటీ తొలగించండి', 'Delete battle')} title={text('తొలగించండి', 'Delete')} onClick={async () => { if (!window.confirm(text('పోటీ తొలగించాలా?', 'Delete this battle?'))) return; setBusy(true); try { const result = await supabase.from('reels_battle').delete().eq('id', battle.id); if (result.error) throw result.error; await qc.invalidateQueries({ queryKey: ['battles'] }); } catch { toast.error(text('తొలగించడం కుదరలేదు.', 'Could not delete.')); } finally { setBusy(false); } }}><Trash2 className="size-4" /></Button>}
  </article>;
}

export function ReelBattles() {
  const { data: me } = useMe();
  const language = useLanguage();
  const text = (te: string, en: string) => language === 'en' ? en : te;
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [ends, setEnds] = useState('');
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(0);
  const battles = useQuery({ queryKey: ['battles', page], queryFn: async () => { const result = await supabase.from('reels_battle').select('*').order('created_at', { ascending: false }).range(page * 10, page * 10 + 9); if (result.error) throw result.error; return result.data ?? []; }});
  const own = useQuery({ queryKey: ['reels', 'own', me?.id], enabled: !!me && adding, queryFn: async () => { if (!me) return []; const result = await supabase.from('reels').select('id,caption').eq('user_id', me.id).eq('published', true).order('created_at', { ascending: false }).limit(100); if (result.error) throw result.error; return result.data ?? []; }});
  return <div className="space-y-4 p-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><h1 className="text-xl font-bold">{text('వీడియోల పోటీ', 'Reels battle')}</h1>{me && !me.block && <Button variant="outline" onClick={() => setAdding(!adding)}><Plus className="size-4" />{text('పోటీ', 'Battle')}</Button>}</div>
    <Button asChild variant="outline"><Link to="/reels">{text('వీడియోలు', 'Reels')}</Link></Button>
    {adding && <form className="space-y-3 border-b pb-4" onSubmit={async e => { e.preventDefault(); if (!me || !a || !b || a === b || !ends || busy) return; const deadline = new Date(ends); if (deadline.getTime() <= Date.now()) { toast.error(text('ముందున్న సమయం ఎంచుకోండి.', 'Choose a future time.')); return; } setBusy(true); try { const result = await supabase.from('reels_battle').insert({ user_id: me.id, title: title.trim(), reel_a: a, reel_b: b, ends_at: deadline.toISOString() }); if (result.error) throw result.error; setAdding(false); setTitle(''); setA(''); setB(''); setEnds(''); setPage(0); await qc.invalidateQueries({ queryKey: ['battles'] }); } catch { toast.error(text('పోటీ పెట్టడం కుదరలేదు.', 'Could not create battle.')); } finally { setBusy(false); } }}>
      <Input translate="no" required maxLength={120} value={title} onChange={e => setTitle(e.target.value)} placeholder={text('పోటీ పేరు', 'Battle title')} aria-label={text('పోటీ పేరు', 'Battle title')} disabled={busy} />
      {[{ value: a, set: setA, name: text('మొదటి వీడియో', 'First video') }, { value: b, set: setB, name: text('రెండవ వీడియో', 'Second video') }].map(field => <label key={field.name} className="block space-y-1"><span>{field.name}</span><select required aria-label={field.name} disabled={busy} className="h-11 w-full min-w-0 rounded-md border border-input bg-background px-2 text-foreground" value={field.value} onChange={e => field.set(e.target.value)}><option value="">{text('ఎంచుకోండి', 'Choose')}</option>{own.data?.map((reel, i) => <option key={reel.id} value={reel.id}>{reel.caption || `${text('వీడియో', 'Video')} ${i + 1}`}</option>)}</select></label>)}
      {own.isError && <Button type="button" variant="outline" onClick={() => void own.refetch()}>{text('మళ్ళీ చూడండి', 'Try again')}</Button>}
      {own.data && own.data.length < 2 && <p>{text('ముందు మీ రెండు వీడియోలు పెట్టండి.', 'Post two of your videos first.')}</p>}
      <label className="block space-y-1"><span>{text('ముగిసే సమయం', 'Closing time')}</span><Input type="datetime-local" required aria-label={text('ముగిసే సమయం', 'Closing time')} value={ends} onChange={e => setEnds(e.target.value)} disabled={busy} /></label>
      <Button type="submit" disabled={busy || !title.trim() || !a || !b || a === b || !ends}>{text('పోటీ పెట్టండి', 'Create battle')}</Button>
    </form>}
    {battles.isPending && <p>{text('వస్తున్నాయి…', 'Loading…')}</p>}
    {battles.isError && <Button variant="outline" onClick={() => void battles.refetch()}>{text('మళ్ళీ చూడండి', 'Try again')}</Button>}
    {battles.data?.length === 0 && <p className="text-muted-foreground">{text('ఇంకా పోటీలు లేవు.', 'No battles yet.')}</p>}
    {battles.data?.map(battle => <BattleRow key={battle.id} battle={battle} />)}
    <div className="flex justify-between"><Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>{text('ముందువి', 'Previous')}</Button><Button variant="outline" disabled={(battles.data?.length ?? 0) < 10} onClick={() => setPage(page + 1)}>{text('తరువాతవి', 'Next')}</Button></div>
  </div>;
}