import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { canRedeemPoints, rewardError } from '@/lib/reward-rules';
import { ProgramEvidence } from '@/components/ProgramEvidence';

export function RewardMembership() {
  const { data: me } = useMe(); const qc = useQueryClient(); const [busy, setBusy] = useState(false), [code, setCode] = useState('');
  const { data } = useQuery({ queryKey: ['reward-membership', me?.id], enabled: Boolean(me), queryFn: async () => {
    if (!me) return { points: 0, referrals: 0 };
    const [wallet, referrals] = await Promise.all([supabase.from('reward_wallets').select('points').eq('user_id', me.id).maybeSingle(), supabase.rpc('my_program_referrals')]);
    if (wallet.error || referrals.error) throw wallet.error || referrals.error;
    const result = referrals.data as { count?: number } | null;
    return { points: wallet.data?.points || 0, referrals: result?.count || 0 };
  } });
  if (!me) return null;
  const run = async (action: () => Promise<void>) => { setBusy(true); try { await action(); await qc.invalidateQueries(); } catch (e) { toast.error(rewardError(e instanceof Error ? e.message : String(e))); } finally { setBusy(false); } };
  return <section className="space-y-3 border-y py-4"><h2 className="text-xl font-bold">మీ పాయింట్లు · Your points: {data?.points || 0}</h2>
    <p className="text-sm">100 పాయింట్లకు ఒక నెల. వరుసగా మూడు నెలల తర్వాత ఒక నెల విరామం. · 100 points per month; three months then a month break.</p>
    <Button disabled={busy || !canRedeemPoints(data?.points || 0)} onClick={() => run(async () => { const result = await supabase.rpc('redeem_reward_points'); if (result.error) throw result.error; toast.success('ఒక నెల పొందారు · Month redeemed'); })}>100 పాయింట్లతో నెల పొందండి · Redeem</Button>
    <p>మీ పరిచయ కోడ్ · Your code: <b>{me.profile?.referral_code}</b></p>
    <p>అర్హమైన చేరికలు · Qualifying joins: {data?.referrals || 0} / 100</p>
    {!me.profile?.referred_by && <div className="space-y-2"><Label htmlFor="referral-code">పరిచయం చేసిన వారి కోడ్ · Referral code</Label><Input id="referral-code" value={code} onChange={e => setCode(e.target.value)} maxLength={40} /><Button disabled={busy || !/^[a-z0-9]{4,40}$/i.test(code)} onClick={() => run(async () => { const result = await supabase.rpc('apply_referral', { _code: code }); if (result.error) throw result.error; toast[result.data ? 'success' : 'error'](result.data ? 'కోడ్ నమోదైంది · Applied' : 'కోడ్ లేదా గడువు సరిపోలలేదు · Invalid or expired'); })}>కోడ్ నమోదు · Apply</Button></div>}
    <ProgramEvidence />
  </section>;
}
