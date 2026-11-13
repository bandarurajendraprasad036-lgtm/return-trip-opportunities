import { POST_LIST_COLUMNS } from '@/lib/post-access';
import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PostCard, type Post } from '@/components/PostCard';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/session';
import { homeVehicleResults, homeJobs, type HomeVehicleSection } from '@/lib/home-listings';
import { SearchExample } from '@/components/SearchExample';
import { areaExamples } from '@/lib/search-examples';
import { IndiaPlaceInput } from '@/components/IndiaPlaceInput';
import { useCurrentArea } from '@/lib/use-current-area';
import type { HomeSettings } from '@/lib/home-settings';
import { ServiceDirectory } from '@/components/ServiceDirectory';
import { requireHomeBell, useHomeBellRung } from '@/lib/home-bell';

const sections: { key: HomeVehicleSection; te: string; en: string; className: string }[] = [
  { key: 'local', te: 'స్థానిక సరకు వాహనాలు', en: 'Local Goods Vehicle', className: 'vehicle-choice-local' },
  { key: 'return', te: 'స్థానిక తిరుగు & ముందస్తు సరకు వాహనాలు', en: 'Local Return & Advance Return Goods Vehicles', className: 'vehicle-choice-return' },
  { key: 'cars', te: 'స్థానిక కార్ల బుకింగ్', en: 'Local Cars Booking', className: 'vehicle-choice-car' },
];

export function HomeListings({ today, settings }: { today: string; settings: HomeSettings }) {
  const [from, setFrom] = useState(settings.fromLocation);
  const [to, setTo] = useState(settings.toLocation);
  const [fromEdited, setFromEdited] = useState(false);
  const [toEdited, setToEdited] = useState(false);
  const [route, setRoute] = useState({ from: '', to: '' });
  const [vehicleSection, setVehicleSection] = useState<HomeVehicleSection | null>(null);
  const [workArea, setWorkArea] = useState('');
  const { data: me } = useMe();
  const rung = useHomeBellRung();
  const { area, message: areaMessage, locating } = useCurrentArea(me?.id);
  const actualArea = area?.area || area?.address || '';
  useEffect(() => {
    if (!fromEdited) setFrom(actualArea || settings.fromLocation);
  }, [actualArea, fromEdited, settings.fromLocation]);
  useEffect(() => {
    if (!toEdited) setTo(settings.toLocation);
  }, [settings.toLocation, toEdited]);
  const jobLocation = route.to || route.from;
  const searched = Boolean(route.from || route.to);
  const vehiclesUnlocked = Boolean(route.from && route.to);
  const { data: posts = [], isLoading, isError } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('posts').select(POST_LIST_COLUMNS).eq('status', 'active').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return data as Post[];
    },
  });
  const vehicleRows = homeVehicleResults(posts, { ...route, area: '' }, today, vehicleSection);
  const status = () => {
    if (!searched) return <p className="home-empty">ఊరి పేరు రాయండి · Enter your place</p>;
    if (isLoading) return <p role="status" className="home-empty">వస్తున్నాయి · Loading…</p>;
    if (isError) return <p role="alert" className="home-empty">నిజమైన నమోదులు రాలేదు · Could not load listings</p>;
    return null;
  };
  const examples = (category: HomeVehicleSection | 'seeker' | 'employer', realCount: number) => searched && !isLoading && realCount === 0
    ? areaExamples(route.from, route.to, category).map((example, index) => <SearchExample key={`${category}-${index}`} example={example} />)
    : null;
  const focusFrom = () => { setFromEdited(true); document.getElementById('home-from')?.focus(); };
  return <>
    <section className="home-market-section border-t-0! pt-0!" aria-label="ఒకే వెతుకులాట · Shared search">
      {settings.showLocation && <div className="home-quick-grid grid-cols-1!">
        {settings.showLocation && <div className="home-quick-box home-location-box"><Button type="button" variant="ghost" className="h-auto min-h-12 w-full whitespace-normal px-1" onClick={focusFrom}><MapPin /><span>స్థానం మార్చండి<span className="block text-xs">Change location</span></span></Button><p className="w-full break-words px-1 text-center text-xs">{actualArea || (locating ? 'చూస్తున్నాం…' : 'ఊరి పేరు ఎంచుకోండి')}</p></div>}
      </div>}
      {!actualArea && areaMessage && <p className="pb-1 text-xs text-muted-foreground">{areaMessage}</p>}
      <form className="home-location-form" onSubmit={event => { event.preventDefault(); setRoute({ from: from.trim(), to: to.trim() }); setVehicleSection(null); }}>
        <div className="home-route-fields">
          <div className="home-route-row"><label htmlFor="home-from">నుండి<span>FROM</span></label><IndiaPlaceInput id="home-from" value={from} onChange={value => { setFromEdited(true); setFrom(value); }} maxLength={80} placeholder="ఊరి పేరు" /></div>
          <div className="home-route-row"><label htmlFor="home-to">వరకు<span>TO</span></label><IndiaPlaceInput id="home-to" value={to} onChange={value => { setToEdited(true); setTo(value); }} maxLength={80} placeholder="ఊరి పేరు" /></div>
        </div>
        <Button type="submit" aria-label="వెతకండి · Search"><Search />వెతకండి · SEARCH</Button>
      </form>
      {searched && <div className="flex items-center justify-between gap-2 py-1 text-sm"><span className="min-w-0 break-words">{[route.from, route.to].filter(Boolean).join(' → ')}</span><Button variant="ghost" size="icon" aria-label="వెతుకులాట తీసేయండి · Clear search" onClick={() => { setRoute({ from: '', to: '' }); setFrom(''); setTo(''); setFromEdited(true); setToEdited(true); setVehicleSection(null); }}><X /></Button></div>}
      {settings.showVehicles && <div className="grid grid-cols-3 gap-2" role="group" aria-label="వాహన ఎంపికలు · Vehicle options">
        {sections.map(section => !vehiclesUnlocked ? <Button key={section.key} type="button" variant="outline" disabled aria-disabled="true" className="h-auto min-h-20 whitespace-normal px-1 py-2 text-sm opacity-100! bg-muted! text-muted-foreground! border-muted-foreground!"><span>🔒 {section.te}<span className="block text-xs">{section.en}</span></span></Button> : <Button key={section.key} type="button" variant="outline" aria-pressed={vehicleSection === section.key} aria-controls="home-vehicle-results" className={`h-auto min-h-20 whitespace-normal px-1 py-2 text-sm ${section.className}`} asChild><Link to="/vehicles" search={{ category: section.key === 'local' ? 'goods' : section.key === 'return' ? 'returns' : 'cars', from: searched ? route.from : from.trim(), to: searched ? route.to : to.trim() }} onClick={event => { if (!requireHomeBell(rung, event)) return; const choice = section.key === 'local' ? 'goods' : section.key; sessionStorage.setItem('gayatri-interest', choice); }}><span>{section.te}<span className="block text-xs">{section.en}</span></span></Link></Button>)}
      </div>}
      {settings.showVehicles && vehicleSection !== null && <section id="home-vehicle-results" className="home-display-column mt-2" aria-live="polite" aria-label="వాహన ఫలితాలు · Vehicle results">
        <h3>{sections.find(section => section.key === vehicleSection)?.te}</h3>
        <div className="home-display-list">{status()}{vehicleRows.map(post => <PostCard key={post.id} post={post} meId={me?.id} compact hideDate={vehicleSection === 'local'} />)}{examples(vehicleSection, vehicleRows.length)}</div>
      </section>}
    </section>
    {(settings.showJobs || settings.showServices) && <div className="border-t border-gold py-3"><label htmlFor="work-area" className="mb-2 block font-bold">ప్రాంతం</label><IndiaPlaceInput id="work-area" value={workArea} onChange={setWorkArea} maxLength={80} placeholder="మీ ప్రాంతం పేరు" /></div>}
    {settings.showJobs && <section className="home-market-section" aria-labelledby="job-location-heading">
      <h2 id="job-location-heading" className="home-section-title">పనులు</h2>
      <div className="home-job-columns">
        {([{ kind: 'seeker', te: 'పని కావాలి', display: 'పని కోసం అప్లై చేసిన వాళ్ళు' }, { kind: 'employer', te: 'పని ఇస్తాను', display: 'పని ఇచ్చే వాళ్ళు' }] as const).map(section => {
          return <section className="home-display-column work-display-column" key={section.kind} aria-label={section.display}>
            <Button asChild className="home-apply"><Link to="/work" search={{ kind: section.kind, area: workArea }} onClick={event => requireHomeBell(rung, event)}>{section.te}</Link></Button>
          </section>;
        })}
      </div>
    </section>}
    {settings.showServices && <ServiceDirectory area={workArea} rung={rung} />}
  </>;
}
