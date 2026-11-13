import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { POST_LIST_COLUMNS } from '@/lib/post-access';
import { useMe } from '@/lib/session';
import { PostCard, type Post } from '@/components/PostCard';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { IndiaPlaceInput } from '@/components/IndiaPlaceInput';
import { workListings } from '@/lib/work-listings';
import { useMasterArea, matchesArea } from '@/lib/master-area';

type Kind = 'seeker' | 'employer';
const TITLE: Record<Kind, string> = { seeker: 'పని కావాలి — పని కోసం అప్లై చేసిన వాళ్ళు', employer: 'పని ఇస్తాను — పని ఇచ్చే వాళ్ళు' };

export const Route = createFileRoute('/work')({
  validateSearch: (s: Record<string, unknown>): { kind: Kind; area: string } => ({ kind: s['kind'] === 'employer' ? 'employer' : 'seeker', area: typeof s['area'] === 'string' ? s['area'].slice(0, 80) : '' }),
  head: ({ match }) => { const t = TITLE[match.search.kind]; return { meta: [{ title: `${t} — గాయత్రి వన్` }, { name: 'description', content: `${t}: ప్రాంతం ఎంచుకుని నిజమైన ప్రకటనలు చూడండి.` }, { property: 'og:title', content: `${t} — గాయత్రి వన్` }, { property: 'og:description', content: 'ప్రాంతం వారీగా నిజమైన పని ప్రకటనలు.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }; },
  component: () => <AppShell hideTopActions><WorkPage /></AppShell>,
});

function WorkPage() {
  const { kind, area: initial } = Route.useSearch();
  const [area, setArea] = useMasterArea(initial);
  const { data: me } = useMe();
  const { data: posts = [], isLoading, isError } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('posts').select(POST_LIST_COLUMNS).eq('status', 'active').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return data as Post[];
    },
  });
  const rows = workListings(posts, area, kind).filter(post => !area.trim() || matchesArea(post.location, area));
  return <section className="space-y-4 py-3">
    <h1 className="text-2xl font-bold">{TITLE[kind]}</h1>
    <div><label htmlFor="work-page-area" className="mb-2 block font-bold">ప్రాంతం</label><IndiaPlaceInput id="work-page-area" value={area} onChange={setArea} maxLength={80} placeholder="మీ ప్రాంతం పేరు" /></div>

    <div className="home-display-list work-display-column">{isLoading ? <p role="status">వస్తున్నాయి</p> : isError ? <p role="alert">వివరాలు రాలేదు</p> : rows.length === 0 ? <p className="home-empty">ఈ ప్రాంతంలో ఇంకా ప్రకటనలు లేవు</p> : rows.map(post => <PostCard key={post.id} post={post} meId={me?.id} compact anonymousWork />)}</div>
  </section>;
}
