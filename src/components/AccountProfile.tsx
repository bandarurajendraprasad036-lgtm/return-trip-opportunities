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

export function AccountProfile() {
  const { data: me } = useMe();
  const { data: program, isLoading, isError } = useAccountProgram(me?.id);
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [occupation, setOccupation] = useState('');
  const [category, setCategory] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [tons, setTons] = useState('');
  const [kind, setKind] = useState('seeker');
  const [busy, setBusy] = useState(false);
  const [publicService, setPublicService] = useState(false);

  useEffect(() => {
    setName(me?.profile?.full_name || '');
    setPhone(me?.profile?.phone || '');
    setLocation(me?.profile?.location || '');
  }, [me?.profile?.full_name, me?.profile?.phone, me?.profile?.location]);

  useEffect(() => {
    if (!program) return;
    setOccupation(program.occupation);
    setCategory(program.category);
    setKind(program.member_kind);
    const vehicle = parseVehicleCategory(program.category);
    setVehicleType(vehicle.vehicleType);
    setTons(vehicle.tons);
  }, [program]);

  const vehicleProfile = kind === 'owner' || kind === 'business';

  return <>
    <section id="account-profile" className="profile-panel space-y-4 border-y px-3 py-5">
      <div>
        <h2 className="text-xl font-bold">నా వివరాలు · My profile</h2>
        <p className="profile-copy text-sm">మొబైల్ నంబరు తప్పనిసరి. మార్గాలు ఖాళీగా వదిలినా వివరాలు భద్రపరచవచ్చు.</p>
      </div>
      <form className="space-y-4" onSubmit={async event => {
        event.preventDefault();
        if (busy || !me) return;
        const mobile = phone.replace(/\D/g, '');
        if (!hasValidMobile(mobile)) { toast.error('సరైన 10 అంకెల మొబైల్ నంబరు ఇవ్వండి · Enter a valid mobile'); return; }
        const savedCategory = vehicleProfile ? vehicleCategory(vehicleType, tons) : category.trim();
        if (!savedCategory) { toast.error(vehicleProfile ? 'వాహనం, సరైన టన్నులు ఇవ్వండి · Check vehicle and tons' : 'వర్గం ఇవ్వండి · Enter category'); return; }
        setBusy(true);
        let phoneSaved = false;
        try {
          const mobileSave = await supabase.from('profiles').update({ phone: mobile }).eq('id', me.id);
          if (mobileSave.error) throw mobileSave.error;
          phoneSaved = true;
          const saved = await supabase.rpc('complete_account_profile', {
            _name: name.trim(),
            _location: location.trim(),
            _occupation: occupation.trim(),
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
        } catch {
          toast.error(phoneSaved ? 'నంబరు భద్రపడింది; మిగిలిన వివరాలు భద్రపడలేదు · Mobile saved; other details not saved' : 'మీ వివరాలు భద్రపడలేదు · Profile not saved');
        } finally { setBusy(false); }
      }}>
        <div className="profile-section space-y-3 rounded-xl p-3">
          <div className="space-y-1">
            <Label htmlFor="account-name">మీ పేరు · Your name</Label>
            <Input id="account-name" value={name} onChange={event => setName(event.target.value)} required maxLength={80} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="account-phone">మొబైల్ నంబరు (తప్పనిసరి) · Mobile required</Label>
            <Input id="account-phone" type="tel" inputMode="numeric" autoComplete="tel" value={phone} onChange={event => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} required pattern="[6-9][0-9]{9}" maxLength={10} placeholder="9876543210" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="account-area">మీ ఊరు · Your place</Label>
            <IndiaPlaceInput id="account-area" value={location} onChange={setLocation} maxLength={80} placeholder="మీ ఊరి పేరు రాయండి" />
          </div>
        </div>

        <div className="profile-section-secondary space-y-3 rounded-xl p-3">
          <div className="space-y-1">
            <Label htmlFor="account-kind">మీ అవసరం · Your need</Label>
            <select id="account-kind" className="h-12 w-full rounded-md border bg-card px-3" value={kind} onChange={event => setKind(event.target.value)}>
              <option value="seeker">పని కావాలా? · Need work?</option>
              <option value="employer">మనిషి కావాలా? · Need a worker?</option>
              <option value="owner">వాహనం ఉంది · Vehicle owner</option>
              <option value="business">వాహనం కావాలి · Need vehicle</option>
              <option value="service">సేవ అందిస్తాను · Service provider</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="account-work">{vehicleProfile ? 'మీ పని / వ్యాపారం · Work / business' : 'మీ పని / నిరుద్యోగి · Work / unemployed'}</Label>
            <Input id="account-work" value={occupation} onChange={event => setOccupation(event.target.value)} required maxLength={100} />
          </div>
          {!vehicleProfile && <div className="space-y-1">
            <Label htmlFor="account-category">పని లేదా సేవ వర్గం · Work or service category</Label>
            <Input id="account-category" value={category} onChange={event => setCategory(event.target.value)} required maxLength={100} />
          </div>}
        </div>

        {vehicleProfile && <div className="profile-vehicle-panel space-y-3 rounded-xl p-3">
          <div className="space-y-1">
            <Label htmlFor="account-vehicle">కావలసిన వాహనం · Wanted vehicle</Label>
            <select id="account-vehicle" className="h-12 w-full rounded-md border bg-card px-3" value={vehicleType} onChange={event => { setVehicleType(event.target.value); if (isCar(event.target.value)) setTons(''); }} required>
              <option value="">ఎంచుకోండి · Choose</option>
              {VEHICLE_TYPES.map(type => <option key={type.value} value={type.value}>{type.te} · {type.en}</option>)}
            </select>
          </div>
          {!isCar(vehicleType) && <div className="space-y-1">
            <Label htmlFor="account-tons">ఎన్ని టన్నులు? · How many tons?</Label>
            <Input id="account-tons" type="number" inputMode="decimal" min="0.1" max="100" step="0.1" value={tons} onChange={event => setTons(event.target.value)} placeholder="ఉదాహరణ: 12" />
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
  </>;
}
