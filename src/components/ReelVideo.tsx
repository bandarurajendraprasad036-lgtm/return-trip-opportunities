import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export function ReelVideo({ path, caption }: { path: string; caption: string }) {
  const video = useQuery({ queryKey: ['reel-video', path], staleTime: 40 * 60 * 1000, queryFn: async () => {
    const { data, error } = await supabase.storage.from('reel-videos').createSignedUrl(path, 3600);
    if (error) throw error;
    return data.signedUrl;
  }});
  return <div className="aspect-[9/16] max-h-[65svh] w-full overflow-hidden bg-muted">
    {video.data ? <video src={video.data} aria-label={caption} controls playsInline preload="metadata" className="h-full w-full object-contain" /> : <div className="flex h-full items-center justify-center">{video.isError ? <Button variant="outline" onClick={() => void video.refetch()}>మళ్ళీ చూడండి · Try again</Button> : <p>వస్తోంది… · Loading…</p>}</div>}
  </div>;
}