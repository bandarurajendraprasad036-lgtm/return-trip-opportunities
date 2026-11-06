import { POST_LIST_COLUMNS } from '@/lib/post-access';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PostCard, type Post } from '@/components/PostCard';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/session';
import { homeVehicleResults, homeJobs, type HomeVehicleSection } from '@/lib/home-listings';
import { SearchExample } from '@/components/SearchExample';
import { vehicleExample, jobExample } from '@/lib/search-examples';
import { IndiaMap } from '@/components/IndiaMap';
import type { MapSelection } from '@/lib/area-map';
import { IndiaPlaceInput } from '@/components/IndiaPlaceInput';

const sections: { key: HomeVehicleSection; te: string; en: string }[] = [
  { key: 'local', te: 'స్థానిక సరకు వాహనాలు', en: 'Local Goods' },
  { key: 'return', te: 'తిరిగి వచ్చే వాహనాలు', en: 'Return Goods' },
  { key: 'cars', te: 'లోకల్ కార్స్', en: 'Local Cars' },
];

export function HomeListings({ today }: { today: string }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [route, setRoute] = useState({ from: '', to: '' });
  const [location, setLocation] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [localInput, setLocalInput] = useState('');
  const [localArea, setLocalArea] = useState('');
  const [mapSelection, setMapSelection] = useState<MapSelection>({});
  const [vehicleSection, setVehicleSection] = useState<HomeVehicleSection>('return');
  const vehicleSelection = { ...route, area: localArea };
  const searchLocal = () => { const area = localInput.trim(); setLocalArea(area); setMapSelection({ area }); };
  const { data: me } = useMe();
  const { data: posts = [], isLoading, isError } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('posts').select(POST_LIST_COLUMNS).eq('status', 'active').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return data as Post[];
    },
  });
  const vehicleRows = homeVehicleResults(posts, vehicleSelection, today, vehicleSection);
  const message = (searched: boolean, empty: boolean) => {
    if (!searched) return <p className="home-empty">ప్రాంతం ఎంచుకోండి<br /><span>Choose location</span></p>;
    if (isLoading) return <p role="status" className="home-empty">వస్తున్నాయి · Loading…</p>;
    if (isError) return <p role="alert" className="home-empty">వివరాలు రాలేదు · Could not load</p>;
    if (empty) return <p className="home-empty">ఇక్కడ నమోదులు లేవు<br /><span>No listings here</span></p>;
    return null;
  };
  return <>
    <section className="home-market-section border-t-0! pt-0!" aria-label="వాహనాల వెతుకులాట · Vehicle search">
      <form className="home-location-form" onSubmit={event => { event.preventDefault(); const next = { from: from.trim(), to: to.trim() }; setRoute(next); setLocalArea(''); setLocalInput(''); setMapSelection(next); }}>
        <div className="grid grid-cols-2 gap-2">
        <div className="min-w-0"><label htmlFor="home-from">నుండి · From Location</label><IndiaPlaceInput id="home-from" value={from} onChange={setFrom} maxLength={80} /></div>
        <div className="min-w-0"><label htmlFor="home-to">వరకు · To Location</label><IndiaPlaceInput id="home-to" value={to} onChange={setTo} maxLength={80} /></div>
        </div>
        <Button type="submit" aria-label="వాహనాలు వెతకండి · Search vehicles"><Search />వెతకండి · SEARCH</Button>
      </form>
      {(route.from || route.to) && <div className="flex items-center justify-between gap-2 py-2 text-sm"><span>{route.from || '…'} → {route.to || '…'}</span><Button variant="ghost" size="icon" aria-label="వాహన ప్రాంతం తీసేయండి · Clear vehicle location" onClick={() => { setRoute({ from: '', to: '' }); setFrom(''); setTo(''); setMapSelection({}); }}><X /></Button></div>}
      <IndiaMap selection={mapSelection} />
      <form className="space-y-2 py-3" onSubmit={event => { event.preventDefault(); searchLocal(); }}>
        <label htmlFor="home-local-area" className="block font-semibold">స్థానిక సరకు వాహనాల ప్రాంతం · Local goods vehicle area</label>
        <IndiaPlaceInput id="home-local-area" value={localInput} onChange={setLocalInput} maxLength={120} />
        <div className="flex gap-2"><Button type="submit" className="flex-1 whitespace-normal"><Search />స్థానిక వాహనాలు వెతకండి · Search local vehicles</Button>{localArea && <Button type="button" variant="ghost" size="icon" aria-label="స్థానిక ప్రాంతం తీసేయండి · Clear local area" onClick={() => { setLocalInput(''); setLocalArea(''); setMapSelection(route); }}><X /></Button>}</div>
      </form>
      <div className="grid grid-cols-3 gap-2" role="group" aria-label="వాహన ఎంపికలు · Vehicle options">
        {sections.map(section => <Button key={section.key} type="button" variant={vehicleSection === section.key ? 'default' : 'outline'} aria-pressed={vehicleSection === section.key} aria-controls="home-vehicle-results" className="h-auto min-h-20 whitespace-normal px-1 py-2 text-sm" onClick={() => { setVehicleSection(section.key); setMapSelection(localArea ? { area: localArea } : route); }}><span>{section.te}<span className="block text-xs">{section.en}</span></span></Button>)}
      </div>
      <section id="home-vehicle-results" className="home-display-column mt-3" aria-live="polite" aria-label="వాహన ఫలితాలు · Vehicle results">
        <h3>{sections.find(section => section.key === vehicleSection)?.te}</h3>
        {localArea && <p className="break-words text-sm">నమోదైన ప్రాంతం · Listed area: {localArea}</p>}
        <div className="home-display-list">{message(true, vehicleRows.length === 0)}{vehicleRows.map(post => <PostCard key={post.id} post={post} meId={me?.id} compact hideDate={vehicleSection === 'local'} />)}{!isLoading && !isError && !localArea && vehicleRows.length === 0 && vehicleSection === 'return' && vehicleExample(route.from, route.to) && <SearchExample example={{ type: 'vehicle', from: route.from, to: route.to }} />}</div>
      </section>
    </section>
    <section className="home-market-section" aria-labelledby="job-location-heading">
      <h2 id="job-location-heading" className="home-section-title"><MapPin />ఉద్యోగాల ప్రాంతం · Job location</h2>
      <form className="flex items-end gap-2 py-3" onSubmit={event => { event.preventDefault(); const area = location.trim(); setJobLocation(area); setMapSelection({ area }); }}>
        <div className="min-w-0 flex-1"><label htmlFor="home-job-location">పని ప్రాంతం · Work location</label><IndiaPlaceInput id="home-job-location" value={location} onChange={setLocation} maxLength={80} /></div>
        <Button type="submit" size="icon" variant="outline" aria-label="ఉద్యోగాలు వెతకండి · Search jobs"><Search /></Button>
        {jobLocation && <Button type="button" size="icon" variant="ghost" aria-label="ఉద్యోగ ప్రాంతం తీసేయండి · Clear job location" onClick={() => { setLocation(''); setJobLocation(''); setMapSelection({}); }}><X /></Button>}
      </form>
      <div className="home-job-columns">
        {([{ kind: 'seeker', te: 'నేను పని వెతుకుతున్నాను', en: 'Job Apply', display: 'పని కావాల్సినవారు', displayEn: 'Wanted Display' }, { kind: 'employer', te: 'నా దగ్గర పని ఉంది', en: 'I Have Job', display: 'ఉద్యోగ ఖాళీలు', displayEn: 'Jobs Display' }] as const).map(section => {
          const rows = homeJobs(posts, jobLocation, section.kind);
          return <section className="home-display-column" key={section.kind} aria-label={section.displayEn}>
            <Button asChild variant="outline" className="home-apply"><Link to="/post/new" search={{ kind: section.kind, loc: jobLocation || undefined }}><span>{section.te}<span className="block text-sm">{section.en}</span></span></Link></Button>
            <h3>{section.display}<span>{section.displayEn}</span></h3>
            <div className="home-display-list">{message(true, rows.length === 0)}{rows.map(post => <PostCard key={post.id} post={post} meId={me?.id} compact />)}{!isLoading && !isError && rows.length === 0 && section.kind === 'employer' && jobExample(jobLocation) && <SearchExample example={{ type: 'job', location: jobLocation, salary: '₹15,000 / నెల · month' }} />}</div>
          </section>;
        })}
      </div>
    </section>
  </>;
}