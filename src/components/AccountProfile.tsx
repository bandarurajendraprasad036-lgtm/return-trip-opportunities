import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useMe } from '@/lib/session';
import { useAccountProgram } from '@/lib/use-account-program';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IndiaPlaceInput } from '@/components/IndiaPlaceInput';
import { PROFILE_POINTS, trialActive } from '@/lib/account-program';

export function AccountProfile() {
  const { data: me } = useMe();
  const { data: program, isLoading, isError } = useAccountProgram(me?.id);
  const qc = useQueryClient();
  const [name, setName] = useState(''), [location, setLocation] = useState(''), [occupation, setOccupation] = useState(''), [category, setCategory] = useState('');
  const [kind, setKind] = useState('seeker'), [busy, setBusy] = useState(false);
  const [publicService, setPublicService] = useState(false);
  useEffect(() => { setName(me?.profile?.full_name || ''); setLocation(me?.profile?.location || ''); }, [me?.profile?.full_name, me?.profile?.location]);
  useEffect(() => { if (program) { setOccupation(program.occupation); setCategory(program.category); setKind(program.member_kind); } }, [program]);
  return <section id="account-profile" className="space-y-3 border-y py-4">
    <h2 className="text-xl font-bold">నా వివరాలు · My profile</h2>
    <form className="space-y-3" onSubmit={async event => {
      event.preventDefault(); if (busy) return; setBusy(true);
      try {
        const saved = await supabase.rpc('complete_account_profile', { _name: name, _location: location, _occupation: occupation, _category: category, _kind: kind });
        if (saved.error) throw saved.error;
        if (kind === 'service' && publicService) {
          const listing = await supabase.rpc('save_service_listing', { _name: '', _service: occupation, _town: location, _category: category, _published: true });
          if (listing.error) { await qc.invalidateQueries(); toast.error('మీ వివరాలు భద్రపడ్డాయి; సేవల జాబితాలో చేరలేదు · Profile saved; listing failed'); return; }
        }
        await qc.invalidateQueries(); toast.success('మీ వివరాలు భద్రపడ్డాయి · Profile saved');
      } catch { toast.error('మీ వివరాలు భద్రపడలేదు · Profile not saved'); } finally { setBusy(false); }
    }}>
      <Label htmlFor="account-name">మీ పేరు · Your name</Label><Input id="account-name" value={name} onChange={e => setName(e.target.value)} required maxLength={80} />
      <Label htmlFor="account-area">మీ ఊరు · Your place</Label><IndiaPlaceInput id="account-area" value={location} onChange={setLocation} maxLength={80} placeholder="మీ ఊరి పేరు రాయండి" />
      <Label htmlFor="account-kind">మీ అవసరం · Your need</Label><select id="account-kind" className="h-12 w-full rounded-md border bg-card px-3" value={kind} onChange={e => setKind(e.target.value)}><option value="seeker">పని కావాలా? · Need work?</option><option value="employer">మనిషి కావాలా? · Need a worker?</option><option value="owner">వాహనం ఉంది · Vehicle owner</option><option value="business">వాహనం కావాలి · Need vehicle</option><option value="service">సేవ అందిస్తాను · Service provider</option></select>
      <Label htmlFor="account-work">మీ పని / నిరుద్యోగి · Work / unemployed</Label><Input id="account-work" value={occupation} onChange={e => setOccupation(e.target.value)} required maxLength={100} />
      <Label htmlFor="account-category">కావాల్సిన పని లేదా వాహనం రకం · Wanted work / vehicle category</Label><Input id="account-category" value={category} onChange={e => setCategory(e.target.value)} required maxLength={100} />
      {kind === 'service' && <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={publicService} onChange={event => setPublicService(event.target.checked)} />నా పని, ఊరు, వర్గం సేవల జాబితాలో అందరికీ చూపించండి; వ్యక్తిగత పేరు, నంబరు, ఫోటో జోడించవద్దు · Publish my service, town and category only</label>}
      <Button type="submit" disabled={busy || isLoading || isError || !location.trim()} className="w-full">వివరాలు పంపండి · Save profile</Button>
    </form>
    {isError && <p role="alert">వివరాలు రాలేదు · Profile unavailable</p>}
    {program ? <p role="status">ప్రారంభ తేదీ · Start: {new Date(program.completed_at).toLocaleDateString('te-IN', { timeZone: 'Asia/Kolkata' })}<br />{program.sharing_active ? 'పంచుకున్న ఆధారాలతో ఉచిత సభ్యత్వం కొనసాగుతోంది · Free sharing membership active' : trialActive(program.completed_at) ? 'పది రోజుల ఉచిత కాలం కొనసాగుతోంది · Ten-day trial active' : 'పది రోజుల ఉచిత కాలం ముగిసింది · Trial ended'}</p> : <p className="text-sm">మొదటిసారి పూర్తి చేస్తే {PROFILE_POINTS} పాయింట్లు, పది రోజుల ఉచిత కాలం · First completion: {PROFILE_POINTS} points and ten-day trial.</p>}
  </section>;
}