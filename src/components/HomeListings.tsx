import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Search, X, LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PostCard, type Post } from '@/components/PostCard';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/session';
import { homeVehicles, homeJobs, type VehicleSection } from '@/lib/home-listings';
import { VILLAGE_SUGGESTIONS } from '@/lib/job-entry';

const sections: { key: VehicleSection; te: string; en: string }[] = [
  { key: 'local', te: 'స్థానిక వాహనాలు', en: 'Local' },
  { key: 'return', te: 'తిరిగి వచ్చే వాహనాలు', en: 'Return Goods' },
  { key: 'advance', te: 'ముందస్తు తిరిగి వచ్చే వాహనాలు', en: 'Advance' },
];

export function HomeListings({ today }: { today: string }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [route, setRoute] = useState({ from: '', to: '' });
  const [location, setLocation] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [position, setPosition] = useState('');
  const [locating, setLocating] = useState(false);
  const locate = () => {
    if (!navigator.geolocation) { setPosition('ఈ పరికరంలో స్థానం అందుబాటులో లేదు · Location unavailable'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(result => {
      setPosition(`${result.coords.latitude.toFixed(5)}, ${result.coords.longitude.toFixed(5)} · ఊరి పేరు పైన నమోదు చేయండి · Enter place above`);
      setLocating(false);
    }, () => { setPosition('స్థానం రాలేదు. ఊరి పేరు నమోదు చేయండి · Location unavailable, enter place'); setLocating(false); }, { timeout: 10000, maximumAge: 0 });
  };
  const { data: me } = useMe();
  const { data: posts = [], isLoading, isError } = useQuery({
    queryKey: ['posts'],
    enabled: Boolean(route.from || route.to || jobLocation),
    queryFn: async () => {
      const { data, error } = await supabase.from('posts').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return data as Post[];
    },
  });
  const message = (searched: boolean, empty: boolean) => {
    if (!searched) return <p className="home-empty">ప్రాంతం ఎంచుకోండి<br /><span>Choose location</span></p>;
    if (isLoading) return <p role="status" className="home-empty">వస్తున్నాయి · Loading…</p>;
    if (isError) return <p role="alert" className="home-empty">వివరాలు రాలేదు · Could not load</p>;
    if (empty) return <p className="home-empty">ఇక్కడ నమోదులు లేవు<br /><span>No listings here</span></p>;
    return null;
  };
  return <>
    <section className="home-market-section" aria-labelledby="vehicle-location-heading">
      <h2 id="vehicle-location-heading" className="home-section-title"><MapPin />వాహనాల ప్రాంతం · Vehicle location</h2>
      <form className="home-location-form" onSubmit={event => { event.preventDefault(); setRoute({ from: from.trim(), to: to.trim() }); }}>
        <div><label htmlFor="home-from">ఎక్కడి నుండి · FROM LOCATION – Current Location</label><Input id="home-from" list="home-places" value={from} onChange={e => setFrom(e.target.value)} maxLength={80} placeholder="ఊరు / జిల్లా · Place" /></div>
        <Button type="button" onClick={locate} disabled={locating} className="whitespace-normal"><LocateFixed />{locating ? 'స్థానం చూస్తున్నాం · Locating…' : 'నా ప్రస్తుత స్థానం చూపించు · Current Location'}</Button>
        {position && <p role="status" className="break-words text-sm">{position}</p>}
        <div><label htmlFor="home-to">ఎక్కడికి · TO LOCATION – Velle Location</label><Input id="home-to" list="home-places" value={to} onChange={e => setTo(e.target.value)} maxLength={80} placeholder="ఊరు / జిల్లా · Place" /></div>
        <Button type="submit" aria-label="వాహనాలు వెతకండి · Search vehicles"><Search />వెతకండి · SEARCH</Button>
      </form>
      <datalist id="home-places">{VILLAGE_SUGGESTIONS.map(place => <option value={place} key={place} />)}</datalist>
      {(route.from || route.to) && <div className="flex items-center justify-between gap-2 py-2 text-sm"><span>{route.from || '…'} → {route.to || '…'}</span><Button variant="ghost" size="icon" aria-label="వాహన ప్రాంతం తీసేయండి · Clear vehicle location" onClick={() => { setRoute({ from: '', to: '' }); setFrom(''); setTo(''); }}><X /></Button></div>}
      <div className="home-vehicle-columns">
        {sections.map(section => {
          const rows = homeVehicles(posts, route.from, route.to, today, section.key);
          return <section key={section.key} aria-label={section.en} className="home-display-column">
            <h3>{section.te}<span>{section.en}</span></h3>
            <div className="home-display-list">{message(Boolean(route.from || route.to), rows.length === 0)}{rows.map(post => <PostCard key={post.id} post={post} meId={me?.id} compact hideDate={section.key === 'local'} />)}</div>
          </section>;
        })}
      </div>
    </section>
    <section className="home-market-section" aria-labelledby="job-location-heading">
      <h2 id="job-location-heading" className="home-section-title"><MapPin />ఉద్యోగాల ప్రాంతం · Job location</h2>
      <form className="flex items-end gap-2 py-3" onSubmit={event => { event.preventDefault(); setJobLocation(location.trim()); }}>
        <div className="min-w-0 flex-1"><label htmlFor="home-job-location">పని ప్రాంతం · Work location</label><Input id="home-job-location" list="home-places" value={location} onChange={e => setLocation(e.target.value)} maxLength={80} placeholder="ఊరు / జిల్లా · Place" /></div>
        <Button type="submit" size="icon" variant="outline" aria-label="ఉద్యోగాలు వెతకండి · Search jobs"><Search /></Button>
        {jobLocation && <Button type="button" size="icon" variant="ghost" aria-label="ఉద్యోగ ప్రాంతం తీసేయండి · Clear job location" onClick={() => { setLocation(''); setJobLocation(''); }}><X /></Button>}
      </form>
      <div className="home-job-columns">
        {([{ kind: 'seeker', te: 'నేను పని వెతుకుతున్నాను', en: 'Job Apply', display: 'పని కావాల్సినవారు', displayEn: 'Wanted Display' }, { kind: 'employer', te: 'నా దగ్గర పని ఉంది', en: 'I Have Job', display: 'ఉద్యోగ ఖాళీలు', displayEn: 'Jobs Display' }] as const).map(section => {
          const rows = homeJobs(posts, jobLocation, section.kind);
          return <section className="home-display-column" key={section.kind} aria-label={section.displayEn}>
            <Button asChild variant="outline" className="home-apply"><Link to="/post/new" search={{ kind: section.kind, loc: jobLocation || undefined }}><span>{section.te}<span className="block text-sm">{section.en}</span></span></Link></Button>
            <h3>{section.display}<span>{section.displayEn}</span></h3>
            <div className="home-display-list">{message(Boolean(jobLocation), rows.length === 0)}{rows.map(post => <PostCard key={post.id} post={post} meId={me?.id} compact />)}</div>
          </section>;
        })}
      </div>
    </section>
  </>;
}