import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { canRedeemPoints, rewardError, SHARING_GROUPS } from '@/lib/reward-rules';

/** Point 9: points redemption and private ten-group evidence, never automatic share verification. */
export function RewardMembership() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState('');
  const { data, error } = useQuery({ queryKey:['reward-membership',me?.id], enabled:!!me, queryFn:async () => {
    if (!me) return { points:0, claims:[] };
    const [wallet,claims] = await Promise.all([supabase.from('reward_wallets').select('points').eq('user_id',me.id).maybeSingle(),supabase.from('sharing_claims').select('*').eq('user_id',me.id).order('created_at',{ascending:false})]);
    if (wallet.error || claims.error) throw wallet.error ?? claims.error;
    return { points:wallet.data?.points ?? 0, claims:claims.data ?? [] };
  }});
  const run = async (action:()=>Promise<void>) => { if (busy) return; setBusy(true); try { await action(); await qc.invalidateQueries(); } catch(e) { toast.error(rewardError(e instanceof Error ? e.message : String(e))); } finally { setBusy(false); } };
  const submit = () => run(async () => {
    if (!me || files.length !== SHARING_GROUPS) return;
    const paths: string[]=[];
    try {
      for (const file of files) {
        if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>5*1024*1024) throw new Error('INVALID_IMAGE');
        const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
        const path=`${me.id}/${crypto.randomUUID()}.${ext}`;
        const upload=await supabase.storage.from('sharing-evidence').upload(path,file,{contentType:file.type});
        if(upload.error) throw upload.error; paths.push(path);
      }
      const saved=await supabase.from('sharing_claims').insert({user_id:me.id,evidence_paths:paths});
      if(saved.error) throw saved.error;
      setFiles([]); toast.success('ఆధారాలు పంపాం; నిర్వాహక ఆమోదం కోసం వేచి ఉండండి. · Awaiting review.');
    } catch(e) { if(paths.length) await supabase.storage.from('sharing-evidence').remove(paths); throw e; }
  });
  if (!me) return null;
  const pending=data?.claims.some(c=>c.status==='pending');
  return <section className="space-y-3 border-y py-4" aria-label="పాయింట్ 9 సభ్యత్వం">
    <h2 className="text-xl font-bold">ఉచిత సభ్యత్వం · Free membership</h2>
    <p className="text-sm">100 పాయింట్లు = ఒక నెల. వరుసగా మూడు ఉచిత నెలల తర్వాత ఒక నెల విరామం. · 100 points per month; three consecutive months, then one month break.</p>
    <p>మీ పాయింట్లు · Your points: <b>{data?.points ?? 0}</b></p>
    <p className="text-sm text-muted-foreground">ఒక్కరు చేరితే ఇచ్చే పాయింట్ల లెక్క ఇంకా ఖరారు కాలేదు. · Referral earning rate awaiting confirmation.</p>
    {error && <p role="alert" className="text-destructive">సమాచారం రాలేదు; మళ్లీ ప్రయత్నించండి. · Please retry.</p>}
    <Button disabled={busy || !canRedeemPoints(data?.points ?? 0)} onClick={()=>run(async()=>{ const result=await supabase.rpc('redeem_reward_points'); if(result.error) throw result.error; toast.success('ఒక నెల సభ్యత్వం పొందారు. · Month redeemed.'); })}>100 పాయింట్లతో నెల పొందండి · Redeem</Button>
    <p className="font-bold">మీ పరిచయ కోడ్ · Your referral code: {me.profile?.referral_code}</p>
    <Button variant="outline" onClick={()=>{ const text=`గాయత్రి వన్‌లో చేరండి ${window.location.origin}/?ref=${me.profile?.referral_code ?? ''}`; window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,'_blank','noopener,noreferrer'); }}>పంచుకోండి · Share</Button>
    {!me.profile?.referred_by && <div className="space-y-2"><Label htmlFor="referral-code">పరిచయం చేసిన వారి కోడ్ · Referral code</Label><Input id="referral-code" value={code} maxLength={16} onChange={e=>setCode(e.target.value)} /><Button disabled={busy || !/^[a-z0-9]{4,16}$/i.test(code)} onClick={()=>run(async()=>{ const result=await supabase.rpc('apply_referral',{_code:code}); if(result.error) throw result.error; toast[result.data?'success':'error'](result.data?'కోడ్ నమోదు అయింది. · Applied.':'కోడ్ సరిపోలలేదు లేదా నమోదు గడువు ముగిసింది. · Invalid or expired.'); })}>కోడ్ నమోదు · Apply code</Button></div>}
    <p className="text-sm">పది వేర్వేరు సమూహాల్లో పంచుకున్న పది ఆధార చిత్రాలు పంపండి. నిర్వాహకుడు పరిశీలించి ఆమోదిస్తే ఒక నెల ఉచితం. పంచుకునే బటన్ నొక్కడం ఆమోదం కాదు. · Ten group screenshots, admin review required.</p>
    <Label htmlFor="sharing-evidence">ఆధార చిత్రాలు · Evidence (10)</Label>
    <Input id="sharing-evidence" type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busy || pending} onChange={e=>{ const next=Array.from(e.target.files ?? []); if(next.length!==10 || next.some(f=>f.size>5*1024*1024 || !['image/jpeg','image/png','image/webp'].includes(f.type))) { toast.error('పది చిత్రాలు ఎంచుకోండి; ఒక్కొక్కటి 5 ఎంబీ లోపు ఉండాలి. · Select ten images, max 5 MB each.'); setFiles([]); return; } setFiles(next); }} />
    <Button disabled={busy || pending || files.length!==10} onClick={submit}>{busy?'వేచి ఉండండి · Please wait':pending?'ఆమోదం కోసం వేచి ఉంది · Pending':'ఆధారాలు పంపండి · Submit evidence'}</Button>
    {data?.claims.map(c=><p key={c.id} className="break-words text-sm">{c.status==='approved'?'ఆమోదం · Approved':c.status==='rejected'?'తిరస్కరణ · Rejected':'పరిశీలనలో · Pending'} {c.admin_note}</p>)}
  </section>;
}