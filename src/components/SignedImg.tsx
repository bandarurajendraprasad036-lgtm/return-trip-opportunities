import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/session';

// Member photos live in private storage; a path is signed for a short time (storage rules still hide photos the member chose to hide).
export function useMemberPhotoUrl(src: string) {
  const isPath = !!src && !/^https:\/\//.test(src);
  const { data: me } = useMe();
  const { data } = useQuery({ queryKey: ['member-photo', me?.id, src], enabled: isPath, staleTime: 0, refetchInterval: 20000, queryFn: async () => { const r = await supabase.storage.from('profile-photos').createSignedUrl(src, 30); return r.error ? '' : r.data.signedUrl; } });
  return isPath ? data ?? '' : src;
}

export function SignedImg({ src, className, alt = '' }: { src: string; className?: string; alt?: string }) {
  const url = useMemberPhotoUrl(src);
  if (!url) return <span aria-hidden className={className} />;
  return <img src={url} alt={alt} className={className} />;
}
