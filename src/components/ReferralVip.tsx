import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/session';
import { referralLink } from '@/lib/account-program';
import type { ReferralVip as Vip } from '@/lib/referral-vip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { VipSlots } from '@/components/VipSlots';

export function ReferralVip() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [region, setRegion] = useState('');
  const [publicName, setPublicName] = useState(false);
  const [photoConsent, setPhotoConsent] = useState(false);
  const consent = useQuery({ queryKey: ['board-consent', me?.id], enabled: Boolean(me), queryFn: async () => {
    const result = await supabase.from('referral_board_consent').select('*').eq('user_id', me?.id ?? '').maybeSingle();
    if (result.error) throw result.error; return result.data;
  } });
  useEffect(() => { setRegion(consent.data?.region ?? ''); setPublicName(consent.data?.published ?? false); setPhotoConsent(consent.data?.photo_consent ?? false); }, [consent.data]);
  const { data, isError, refetch } = useQuery({ queryKey: ['referral-vip', me?.id], enabled: !!me, refetchInterval: 10000, refetchOnWindowFocus: true, queryFn: async () => {
    const result = await supabase.rpc('my_referral_vip');
    if (result.error) throw result.error;
    return result.data as unknown as Vip;
  }});
  if (!me) return null;
  return <section className="space-y-3 border-y py-4"><h2 className="text-xl font-bold">మీ పరిచయాలు · Your referrals</h2>
    {isError && <Button variant="outline" onClick={() => void refetch()}>మళ్లీ చూడండి · Retry</Button>}
    {data && <><p>మీ సంకేతం · Your code: <b>{data.code}</b></p><p className="break-all">{referralLink(data.code)}</p>
      <p>మీ ద్వారా చేరినవారు · Your joins: <b>{data.count}</b></p>
      <p>మీ స్థానం · Your rank: <b>{data.rank ?? '—'}</b></p>
      <p>20% నగదు బహుమతి · Cash prize: <b>₹{(data.reward_paise / 100).toFixed(2)}</b></p>
      <p className="text-sm">పరిచయం చేసినందుకు · Inviter benefit: ₹{(data.inviter_reward_paise / 100).toFixed(2)}; పాత చేరిక బహుమతి · Historical invitee benefit: ₹{(data.invitee_reward_paise / 100).toFixed(2)}</p>
      <p className="text-sm">మీ ₹99 అర్హత ఉన్నప్పుడు మీ సంకేతంతో చేరిన వ్యక్తి నిజమైన చెల్లింపు నిర్ధారిస్తే, పరిచయం చేసిన మీకు మాత్రమే 20% వేడుక బహుమతి లెక్క. ₹99పై ₹19.80. చెల్లించని నిజమైన చేరిక కూడా సంఖ్యలో ఉంటుంది. · Eligible direct inviter only; unpaid genuine joins still count.</p>
      <VipSlots />
      <p className="text-sm text-muted-foreground">నిర్ధారించిన చెల్లింపుల బహుమతి లెక్క మాత్రమే; నగదు పంపినట్లు కాదు. · Confirmed reward balance, not a payout receipt.</p>
      <p>{data.vip ? 'మొదటి వంద స్థానాల్లో ఉన్నారు; ప్రత్యేక ప్రవేశ అర్హత పొందారు. · Top 100 VIP eligibility earned.' : `మొదటి వంద స్థానాలకు ఇంకా ${data.needed} మందిని చేర్పించండి. · ${data.needed} more joins to enter Top 100.`}</p>
      <p className="text-sm">ఇతరుల చేరికలతో స్థానాలు మారవచ్చు. వేడుక పూర్తి వివరాలు మరో పదిహేను రోజుల్లో తెలియజేస్తాం. · Rankings can change; event details will be announced in fifteen days.</p>
      <Label htmlFor="vip-region">పట్టికలో మీ రాష్ట్రం · Leaderboard state</Label><select id="vip-region" value={region} onChange={e => setRegion(e.target.value)} className="h-12 w-full rounded-md border bg-card px-2"><option value="">ఎంచుకోండి · Choose</option><option value="TG">తెలంగాణ · Telangana</option><option value="AP">ఆంధ్రప్రదేశ్ · Andhra Pradesh</option></select>
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={publicName} onChange={e => setPublicName(e.target.checked)} />నా పేరును స్థానాల పట్టికలో చూపించడానికి అనుమతి · Show my name publicly</label>
      <Button asChild variant="outline"><Link to="/service-profile">పోటీకి పంచుకునే చిత్రం · Published photo</Link></Button>
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={photoConsent} onChange={e => setPhotoConsent(e.target.checked)} />నేను ప్రచురించిన సేవా చిత్రాన్ని పోటీ పట్టికలో చూపించడానికి ప్రత్యేక అనుమతి; తీసివేయడానికి ఎంపిక ఆపి భద్రపరచండి. · Allow my published service photo on rankings; uncheck and save to withdraw.</label>
      <Button className="h-auto min-h-12 max-w-full whitespace-normal" disabled={busy || !region} variant="outline" onClick={async () => { setBusy(true); const result = await supabase.from('referral_board_consent').upsert({ user_id: me.id, region, published: publicName, photo_consent: photoConsent, display_name: publicName ? me.profile?.full_name || '' : '' }); setBusy(false); if (result.error) toast.error('ఎంపిక భద్రపడలేదు'); else { await qc.invalidateQueries({ queryKey: ['referral-board'] }); toast.success('పట్టిక ఎంపిక భద్రపడింది'); } }}>పట్టిక ఎంపిక భద్రపరచండి · Save leaderboard choice</Button>
      {!data.invited_by && <div className="space-y-2"><Label htmlFor="vip-referral-code">మిమ్మల్ని పరిచయం చేసిన వారి సంకేతం · Inviter code</Label><Input id="vip-referral-code" value={code} onChange={e => setCode(e.target.value)} maxLength={40} /><Button disabled={busy || !/^[a-z0-9]{4,40}$/i.test(code)} onClick={async () => { setBusy(true); try { const result = await supabase.rpc('apply_referral', { _code: code }); if (result.error) throw result.error; if (!result.data) { toast.error('సంకేతం సరిపోలలేదు లేదా ఇప్పటికే నమోదు అయింది · Invalid or already linked'); return; } await qc.invalidateQueries({ queryKey: ['referral-vip'] }); await qc.invalidateQueries({ queryKey: ['me'] }); toast.success('పరిచయం నమోదైంది · Referral recorded'); } catch { toast.error('నమోదు కాలేదు · Could not save'); } finally { setBusy(false); } }}>నమోదు చేయండి · Apply</Button></div>}
    </>}
  </section>;
}