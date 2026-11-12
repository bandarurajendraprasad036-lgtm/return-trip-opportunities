import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { filterServiceListings, type ServiceListing } from '@/lib/service-directory';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { useMe } from '@/lib/session';
import { BellPaymentNotice } from '@/components/BellPaymentNotice';
import { Link } from '@tanstack/react-router';
import { PostCard, type Post } from '@/components/PostCard';
import { workListings } from '@/lib/work-listings';

export function ServiceDirectory({ area, posts = [] }: { area?: string; posts?: Post[] } = {}) {
  const [town, setTown] = useState('All');
  const [category, setCategory] = useState('All');
  const nav = useNavigate(); const { data: me } = useMe(); const [busy, setBusy] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const contact = async (owner: string) => {
    if (!me) { setPaymentOpen(true); return; }
    setBusy(true); const result = await supabase.rpc('ring_service', { _owner: owner }); setBusy(false);
    if (result.error) { if (result.error.message.includes('PAID_BELL_REQUIRED')) setPaymentOpen(true); else toast.error('సంభాషణ ప్రారంభం కాలేదు'); return; }
    if (result.data) void nav({ to: '/chat/$userId', params: { userId: result.data }, search: { post: undefined } });
  };
  const { data: rows = [], isPending, isError } = useQuery({
    queryKey: ['service-directory'], refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('public_service_directory');
      if (error) throw error;
      return (Array.isArray(data) ? data : []) as ServiceListing[];
    },
  });
  const filtered = filterServiceListings(rows, area ?? town, category);
  return <section className="home-market-section" aria-labelledby="service-directory-title">
    <h2 id="service-directory-title" className="home-section-title">సేవలు అందించేవారు · Service providers</h2>
    {area === undefined && <div className="grid grid-cols-2 gap-2">
      <div><Label htmlFor="service-town-filter">ఊరు · Town</Label><Input id="service-town-filter" value={town} onChange={event => setTown(event.target.value)} placeholder="అన్నీ · All" /></div>
      <div><Label htmlFor="service-category-filter">వర్గం · Category</Label><Input id="service-category-filter" className="min-w-0" value={category === 'All' ? '' : category} list="service-categories" placeholder="మీ కేటగిరి యాడ్ చేసుకోండి" onChange={event => setCategory(event.target.value || 'All')} /><datalist id="service-categories">{['Electrician','Plumber','Technician','Driver','Carpenter','Welder','Painter','Mechanic','Mason','Tailor',...rows.map(row => row.category || row.service)].filter((v,i,a) => v && a.indexOf(v) === i).map(value => <option key={value} value={value} />)}</datalist></div>
    </div>}
    <BellPaymentNotice open={paymentOpen} onOpenChange={setPaymentOpen} />
    <div className="home-job-columns">{(['seeker', 'employer'] as const).map(kind => {
      const entries = workListings(posts, area ?? town, kind, true);
      return <section key={kind} className="home-display-column work-display-column"><Button asChild className="home-apply"><Link to="/post/new" search={{ kind, loc: area || undefined, service: true }}>{kind === 'seeker' ? 'సర్వీస్ కావాలి' : 'నేను సర్వీస్ ఇస్తాను'}</Link></Button><h3>{kind === 'seeker' ? 'సర్వీస్ కావాలి అన్న వాళ్ళు' : 'సర్వీస్ ఇచ్చే వాళ్ళు'}</h3>
        {entries.map(post => <PostCard key={post.id} post={post} meId={me?.id} compact />)}
        {kind === 'employer' && filtered.map(row => <article key={row.user_id} className="home-post-row"><div className="flex items-start justify-between gap-2"><div className="min-w-0 flex-1 break-words"><h4 translate="no">{row.service}</h4><p translate="no">{row.town || 'ప్రాంతం ఇవ్వలేదు'}</p><p>రుసుము ఇవ్వలేదు</p></div><Button size="icon" variant="outline" className="shrink-0" aria-label="గంట · Bell" disabled={busy} onClick={() => void contact(row.user_id)}><Bell /></Button></div><p className="text-xs text-muted-foreground">పేరు: దాచబడింది · మొబైల్ నంబరు: దాచబడింది · ఫోటో: దాచబడింది · షాప్ పేరు: దాచబడింది</p></article>)}
        {isPending ? <p role="status">వస్తున్నాయి</p> : isError ? <p role="alert">వివరాలు రాలేదు</p> : entries.length === 0 && (kind === 'seeker' || filtered.length === 0) ? <p className="home-empty">ఇంకా ప్రకటనలు లేవు</p> : null}
      </section>;
    })}</div>
  </section>;
}