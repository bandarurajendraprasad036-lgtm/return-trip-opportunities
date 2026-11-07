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

const sections: { key: HomeVehicleSection; te: string; en: string }[] = [
  { key: 'local', te: 'స్థానిక సరకు వాహనాలు', en: 'Local Goods' },
  { key: 'return', te: 'తిరిగి వచ్చే వాహనాలు', en: 'Return Goods' },
  { key: 'cars', te: 'లోకల్ కార్స్', en: 'Local Cars' },
];

export function HomeListings({ today }: { today: string }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [fromEdited, setFromEdited] = useState(false);
  const [route, setRoute] = useState({ from: '', to: '' });
  const [vehicleSection, setVehicleSection] = useState<HomeVehicleSection>('return');
  const { data: me } = useMe();
  const { area, message: areaMessage, locating } = useCurrentArea(me?.id);
  const actualArea = area?.area || area?.address || '';
  useEffect(() => {
    if (actualArea && !fromEdited) setFrom(actualArea);
  }, [actualArea, fromEdited]);
  const jobLocation = route.to || route.from;
  const searched = Boolean(route.from || route.to);
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
  return <>
    <section className="home-market-section border-t-0! pt-0!" aria-label="ఒకే వెతుకులాట · Shared search">
      <div className="flex items-start justify-between gap-2 py-2">
        <p className="min-w-0 break-words text-sm"><MapPin className="mr-1 inline size-4" />మీరు ఇప్పుడు ఇక్కడ ఉన్నారు · Current location: {actualArea || (locating ? 'చూస్తున్నాం · Locating…' : 'స్థానం తెలియదు · Not available')}</p>
        <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={() => { setFromEdited(true); document.getElementById('home-from')?.focus(); }}>మార్చండి · Change</Button>
      </div>
      {!actualArea && areaMessage && <p className="pb-2 text-xs text-muted-foreground">{areaMessage}</p>}
      <form className="home-location-form" onSubmit={event => { event.preventDefault(); setRoute({ from: from.trim(), to: to.trim() }); }}>
        <div className="grid grid-cols-1 gap-2">
          <div className="min-w-0"><label htmlFor="home-from">నుండి · From</label><IndiaPlaceInput id="home-from" value={from} onChange={value => { setFromEdited(true); setFrom(value); }} maxLength={80} placeholder="మీ ఊరి పేరు రాయండి" /></div>
          <div className="min-w-0"><label htmlFor="home-to">వరకు · To</label><IndiaPlaceInput id="home-to" value={to} onChange={setTo} maxLength={80} placeholder="మీకు ఎక్కడ కావాలో ఆ ఊరి పేరు రాయండి" /></div>
        </div>
        <Button type="submit" aria-label="వెతకండి · Search"><Search />వెతకండి · SEARCH</Button>
      </form>
      {searched && <div className="flex items-center justify-between gap-2 py-2 text-sm"><span className="min-w-0 break-words">{[route.from, route.to].filter(Boolean).join(' → ')}</span><Button variant="ghost" size="icon" aria-label="వెతుకులాట తీసేయండి · Clear search" onClick={() => { setRoute({ from: '', to: '' }); setFrom(''); setTo(''); setFromEdited(true); }}><X /></Button></div>}
      <div className="grid grid-cols-3 gap-2" role="group" aria-label="వాహన ఎంపికలు · Vehicle options">
        {sections.map(section => <Button key={section.key} type="button" variant={vehicleSection === section.key ? 'default' : 'outline'} aria-pressed={vehicleSection === section.key} aria-controls="home-vehicle-results" className="h-auto min-h-20 whitespace-normal px-1 py-2 text-sm" onClick={() => setVehicleSection(section.key)}><span>{section.te}<span className="block text-xs">{section.en}</span></span></Button>)}
      </div>
      <section id="home-vehicle-results" className="home-display-column mt-3" aria-live="polite" aria-label="వాహన ఫలితాలు · Vehicle results">
        <h3>{sections.find(section => section.key === vehicleSection)?.te}</h3>
        <div className="home-display-list">{status()}{vehicleRows.map(post => <PostCard key={post.id} post={post} meId={me?.id} compact hideDate={vehicleSection === 'local'} />)}{examples(vehicleSection, vehicleRows.length)}</div>
      </section>
    </section>
    <section className="home-market-section" aria-labelledby="job-location-heading">
      <h2 id="job-location-heading" className="home-section-title"><MapPin />పనులు · Jobs{jobLocation && <span className="break-words text-sm"> — {jobLocation}</span>}</h2>
      <div className="home-job-columns">
        {([{ kind: 'seeker', te: 'పని కావాలా?', en: 'Need work?', display: 'పని కావాల్సినవారు', displayEn: 'Job seekers' }, { kind: 'employer', te: 'మనిషి కావాలా?', en: 'Need a worker?', display: 'ఉద్యోగ ఖాళీలు', displayEn: 'Jobs' }] as const).map(section => {
          const rows = homeJobs(posts, jobLocation, section.kind);
          return <section className="home-display-column" key={section.kind} aria-label={section.displayEn}>
            <Button asChild variant="outline" className="home-apply"><Link to="/post/new" search={{ kind: section.kind, loc: jobLocation || undefined }}><span>{section.te}<span className="block text-sm">{section.en}</span></span></Link></Button>
            <h3>{section.display}<span>{section.displayEn}</span></h3>
            <div className="home-display-list">{status()}{rows.map(post => <PostCard key={post.id} post={post} meId={me?.id} compact />)}{examples(section.kind, rows.length)}</div>
          </section>;
        })}
      </div>
    </section>
  </>;
}
