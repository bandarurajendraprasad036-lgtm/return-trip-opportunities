import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/session';

export function VehiclePostPhoto({ path }: { path: string }) {
  const { data: me } = useMe();
  const { data: url } = useQuery({
    queryKey: ['vehicle-post-photo', me?.id, path], enabled: !!me && !!path,
    staleTime: 240000,
    queryFn: async () => {
      const result = await supabase.storage.from('vehicle-post-photos').createSignedUrl(path, 300);
      if (result.error) throw result.error;
      return result.data.signedUrl;
    },
  });
  return url ? <img src={url} alt="వాహన ప్రకటన ఫోటో" className="max-h-64 w-full object-contain" /> : null;
}