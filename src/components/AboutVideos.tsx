import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { aboutVideoSource, parseAboutVideos } from '@/lib/about-videos';
import { Button } from '@/components/ui/button';

export function AboutVideos() {
  const videos = useQuery({ queryKey: ['setting', 'youtube_url'], queryFn: async () => {
    const result = await supabase.from('app_settings').select('value').eq('key', 'youtube_url').maybeSingle();
    if (result.error) throw result.error;
    return result.data?.value ?? '';
  } });
  if (videos.isPending) return <p role="status">వీడియోలు వస్తున్నాయి…</p>;
  if (videos.isError) return <div role="alert"><p>వీడియోలు రాలేదు.</p><Button variant="outline" onClick={() => void videos.refetch()}>మళ్లీ ప్రయత్నించండి</Button></div>;
  const rows = parseAboutVideos(videos.data);
  return <section aria-label="గాయత్రి వన్ గురించి వీడియోలు" className="space-y-4">
    {!rows.length && <p className="text-muted-foreground">ఇంకా వీడియోలు పెట్టలేదు.</p>}
    {rows.map(row => {
      const source = aboutVideoSource(row.url);
      if (!source) return null;
      return <article key={source.src} className="space-y-2 border-b pb-4">
        <h2 className="break-words text-xl font-bold" translate="no">{row.title || 'గాయత్రి వన్ గురించి'}</h2>
        {source.kind === 'youtube' ? <iframe loading="lazy" className="aspect-video w-full border-0" src={source.src} title={row.title || 'గాయత్రి వన్ గురించి'} allow="fullscreen; picture-in-picture" allowFullScreen /> : <video className="aspect-video w-full" src={source.src} controls preload="metadata" />}
      </article>;
    })}
  </section>;
}