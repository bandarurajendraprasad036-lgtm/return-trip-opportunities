import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { filterServiceListings, type ServiceListing } from '@/lib/service-directory';

export function ServiceDirectory() {
  const [town, setTown] = useState('All');
  const [category, setCategory] = useState('All');
  const { data: rows = [], isPending, isError } = useQuery({
    queryKey: ['service-directory'], refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('public_service_directory');
      if (error) throw error;
      return (Array.isArray(data) ? data : []) as ServiceListing[];
    },
  });
  const filtered = filterServiceListings(rows, town, category);
  return <section className="home-market-section" aria-labelledby="service-directory-title">
    <h2 id="service-directory-title" className="home-section-title">సేవలు అందించేవారు · Service providers</h2>
    <div className="grid grid-cols-2 gap-2">
      <div><Label htmlFor="service-town-filter">ఊరు · Town</Label><Input id="service-town-filter" value={town} onChange={event => setTown(event.target.value)} placeholder="అన్నీ · All" /></div>
      <div><Label htmlFor="service-category-filter">వర్గం · Category</Label><select id="service-category-filter" className="h-12 w-full rounded-md border bg-card px-2" value={category} onChange={event => setCategory(event.target.value)}><option value="All">అన్నీ · All</option><option value="Electrician">ఎలక్ట్రీషియన్ · Electrician</option><option value="Plumber">ప్లంబర్ · Plumber</option><option value="Driver">డ్రైవర్ · Driver</option>{Array.from(new Set(rows.map(row => row.category || row.service))).filter(value => value && !['electrician','plumber','driver'].includes(value.toLowerCase())).map(value => <option key={value} value={value}>{value}</option>)}</select></div>
    </div>
    {isPending ? <p role="status">సేవల వివరాలు వస్తున్నాయి · Loading services</p> : isError ? <p role="alert">సేవల వివరాలు రాలేదు · Could not load services</p> : filtered.length === 0 ? <p className="py-4">ఈ ఎంపికకు సేవల నమోదు ఇంకా లేదు · No published services for this selection</p> : <ul className="divide-y">{filtered.map(row => <li key={row.user_id} className="flex items-center justify-between gap-3 py-4"><div className="min-w-0 break-words"><p className="font-bold">{row.service}</p><p>{row.town || 'ఊరు ఇవ్వలేదు · Town not supplied'}</p></div><Button asChild variant="outline"><Link to="/profile/$userId" params={{ userId: row.user_id }}>వివరాలు · Details</Link></Button></li>)}</ul>}
  </section>;
}