import { supabase } from '@/integrations/supabase/client';
// Owner or admin; the database checks who may delete and also removes the ad's bell records.
export async function deleteOwnPost(id: string) {
  const result = await supabase.rpc('delete_post_everywhere', { _post: id });
  if (result.error) throw result.error;
  if (result.data !== true) throw new Error('NOT_DELETED');
}
