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
import { SavedVehicleRoutes } from '@/components/SavedVehicleRoutes';
import { hasValidMobile } from '@/lib/phone';
import { isCar, VEHICLE_TYPES } from '@/lib/vehicle-types';
import { parseVehicleCategory, vehicleCategory } from '@/lib/profile-vehicle';
import { PhoneNumberChange } from '@/components/PhoneNumberChange';
import { ProviderContacts } from '@/components/ProviderContacts';
import { SubscribeAfterProfile } from '@/components/SubscribeAfterProfile';
import { markAccountBellActivated } from '@/lib/bell-activation';
import { BilingualLabel } from '@/components/BilingualLabel';
import { PROFILE_NEEDS, PROFILE_OCCUPATIONS, TECHNICIAN_WORKS, FINAL_PROFILE_PARAGRAPHS } from '@/lib/november-profile';

export function AccountProfile() {
  const { data: me } = useMe();
  const { data: program, isLoading, isError } = useAccountProgram(me?.id);
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [occupation, setOccupation] = useState('');
  const [category, setCategory] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [tons, setTons] = useState('');
  const [kind, setKind] = useState('seeker');
  const [busy, setBusy] = useState(false);
  const [publicService, setPublicService] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [interest, setInterest] = useState('');
  const [changeProfession, setChangeProfession] = useState(false);
  useEffect(() => {
    const value = sessionStorage.getItem('gayatri-interest') || '';
    setInterest(value);
    if (['cars', 'goods', 'return'].includes(value)) {
      setKind('business');
      if (value === 'cars') setVehicleType('Car');
    }
  }, [program]);

  useEffect(() => {
    setName(me?.profile?.full_name || '');
    setLocation(me?.profile?.location || '');
  }, [me?.profile?.full_name, me?.profile?.location]);

  useEffect(() => {
    if (!program) return;
    setOccupation(program.occupation);
    setCategory(program.category);
    setKind(program.member_kind);
    const vehicle = parseVehicleCategory(program.category);
    setVehicleType(vehicle.vehicleType);
    setTons(vehicle.tons);
    const selection = sessionStorage.getItem('gayatri-interest');
    if (['cars', 'goods', 'return'].includes(selection || '')) {
      setKind('business');
      if (selection === 'cars') { setVehicleType('Car'); setTons(''); }
    }
  }, [program]);

  const vehicleProfile = kind === 'owner' || kind === 'business';

  return <>
    <SubscribeAfterProfile open={subscribeOpen} onOpenChange={setSubscribeOpen} />
    <section id="account-profile" className="profile-panel space-y-4 border-y px-3 py-5">
      <div>
        <h2 className="text-xl font-bold">నా వివరాలు · My profile</h2>
        <div className="flex items-center justify-between gap-2"><p className="profile-copy">మీ వృత్తి: {PROFILE_OCCUPATIONS.find(item => item.value === occupation)?.te || occupation || 'ఉద్యోగం'}</p><Button type="button" variant="outline" onClick={() => setChangeProfession(value => !value)}>మార్చండి</Button></div>
        {changeProfession && <select aria-label="మీ వృత్తి" value={occupation} onChange={event => { setOccupation(event.target.value); setChangeProfession(false); }} className="h-12 w-full rounded-md border bg-card px-3"><option value="Driver">డ్రైవర్</option><option value="Job">ఉద్యోగం</option><option value="Business">బిజినెస్</option><option value="Other">ఇతరము</option></select>}
        <div className="mt-4 space-y-2">{FINAL_PROFILE_PARAGRAPHS.map(paragraph => <p key={paragraph} className="profile-copy">{paragraph}</p>)}<p className="text-sm">60% నుండి 70% తగ్గింపు ప్రతి బండికి హామీ కాదు. బండి యజమానితో ధర మాట్లాడుకోండి.</p></div>
      </div>
      <form className="space-y-4" onSubmit={async event => {
        event.preventDefault();
        if (busy || !me) return;
        const mobile = me.profile?.phone ?? '';
        if (!hasValidMobile(mobile)) { toast.error('ముందుగా మొబైల్ నంబరు కోడ్‌తో ధృవీకరించండి · Verify your mobile first'); return; }
        const savedCategory = vehicleProfile ? vehicleCategory(vehicleType, tons) : category.trim();
        if (!savedCategory) { toast.error(vehicleProfile ? 'వాహనం, సరైన టన్నులు ఇవ్వండి · Check vehicle and tons' : 'వర్గం ఇవ్వండి · Enter category'); return; }
        setBusy(true);
        try {
          const saved = await supabase.rpc('complete_account_profile', {
            _name: name.trim(),
            _location: location.trim(),
            _occupation: kind === 'service' ? category.trim() : occupation.trim(),
            _category: savedCategory,
            _kind: kind,
          });
          if (saved.error) throw saved.error;
          if (kind === 'service' && publicService) {
            const listing = await supabase.rpc('save_service_listing', { _name: '', _service: occupation.trim(), _town: location.trim(), _category: category.trim(), _published: true });
            if (listing.error) {
              await qc.invalidateQueries();
              toast.error('మీ వివరాలు భద్రపడ్డాయి; సేవల జాబితాలో చేరలేదు · Profile saved; listing failed');
              return;
            }
          }
          await qc.invalidateQueries();
          toast.success('మీ వివరాలు భద్రపడ్డాయి · Profile saved');
          const paid = await supabase.rpc('has_paid_bell', { _user: me.id });
          if (paid.data) { await supabase.from('notification_preferences').upsert({ user_id: me.id, enabled: true }); await markAccountBellActivated(me.id); }
          else setSubscribeOpen(true);
        } catch {
          toast.error('మీ వివరాలు భద్రపడలేదు · Profile not saved');
        } finally { setBusy(false); }
      }}>
        <div className="profile-section space-y-3 rounded-xl p-3">
          <div className="space-y-1">
            <Label htmlFor="account-name">మీ పేరు · Your name</Label>
            <Input id="account-name" value={name} onChange={event => setName(event.target.value)} required maxLength={80} />
          </div>
          <PhoneNumberChange currentPhone={me?.profile?.phone ?? ''} />
          <div className="space-y-1">
            <Label htmlFor="account-area">మీ ఊరు · Your place</Label>
            <IndiaPlaceInput id="account-area" value={location} onChange={setLocation} maxLength={80} placeholder="మీ ఊరి పేరు రాయండి" />
          </div>
        </div>

        <div className="profile-section-secondary space-y-3 rounded-xl p-3">
          <div className="space-y-1">
            <Label htmlFor="account-kind"><BilingualLabel te="మీకు ఏది అవసరం?" en="What Do You Need?" /></Label>
            <select id="account-kind" className="h-auto min-h-12 w-full rounded-md border bg-card px-3 py-3" value={kind} onChange={event => { setKind(event.target.value); if (event.target.value === 'service') setCategory(''); }}>
              {PROFILE_NEEDS.map(item => <option translate="no" key={item.value} value={item.value}>{item.te} / {item.en}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="account-work"><BilingualLabel te="మీరు ఏం చేస్తారు?" en="What Do You Do?" /></Label>
            <select id="account-work" value={occupation} onChange={event => setOccupation(event.target.value)} required className="h-12 w-full rounded-md border bg-card px-3"><option value="">ఎంచుకోండి</option>{occupation && !PROFILE_OCCUPATIONS.some(item => item.value === occupation) && <option translate="no" value={occupation}>{occupation}</option>}{PROFILE_OCCUPATIONS.map(item => <option translate="no" key={item.value} value={item.value}>{item.te} / {item.en}</option>)}</select>
          </div>
          {!vehicleProfile && <div className="space-y-1">
            <Label htmlFor="account-category"><BilingualLabel te="ఏ వాహనం / ఏ పని?" en="Which Vehicle / Work?" /></Label>
            {kind === 'service' ? <select id="account-category" value={category} onChange={event => setCategory(event.target.value)} required className="h-12 w-full rounded-md border bg-card px-3"><option value="">ఎంచుకోండి</option>{category && !TECHNICIAN_WORKS.some(item => item.value === category) && <option translate="no" value={category}>{category}</option>}{TECHNICIAN_WORKS.map(item => <option translate="no" key={item.value} value={item.value}>{item.te} / {item.en}</option>)}</select> : <Input id="account-category" value={category} onChange={event => setCategory(event.target.value)} required maxLength={100} />}
          </div>}
        </div>

        {vehicleProfile && <div className="profile-vehicle-panel space-y-3 rounded-xl p-3">
          <div className="space-y-1">
            <Label htmlFor="account-vehicle"><BilingualLabel te="ఏ వాహనం / ఏ పని?" en="Which Vehicle / Work?" /></Label>
            <select id="account-vehicle" className="h-12 w-full rounded-md border bg-card px-3" value={vehicleType} onChange={event => { setVehicleType(event.target.value); if (isCar(event.target.value)) setTons(''); }} required>
              <option value="">ఎంచుకోండి · Choose</option>
              {VEHICLE_TYPES.map(type => <option key={type.value} value={type.value}>{type.te} · {type.en}</option>)}
            </select>
          </div>
          {!isCar(vehicleType) && <div className="space-y-1">
            <Label htmlFor="account-tons">ఎన్ని టన్నులు? · How many tons?</Label>
            <Input id="account-tons" type="number" inputMode="decimal" min="0.1" max="100" step="0.1" value={tons} onChange={event => setTons(event.target.value)} placeholder="Mini truck - 3 టన్నులు / Mini Truck - 3 Tonnes" />
          </div>}
        </div>}

        {kind === 'service' && <label className="profile-copy flex items-start gap-2 rounded-xl border p-3 text-sm">
          <input type="checkbox" checked={publicService} onChange={event => setPublicService(event.target.checked)} />
          నా పని, ఊరు, వర్గం సేవల జాబితాలో అందరికీ చూపించండి; వ్యక్తిగత పేరు, నంబరు, ఫోటో జోడించవద్దు · Publish my service, town and category only
        </label>}
        <Button type="submit" disabled={busy || isLoading || isError || !location.trim()} className="min-h-12 w-full">వివరాలు భద్రపరచండి · Save profile</Button>
      </form>
      {isError && <p role="alert">వివరాలు రాలేదు · Profile unavailable</p>}
    </section>
    <SavedVehicleRoutes />
    <ProviderContacts />
  </>;
}
