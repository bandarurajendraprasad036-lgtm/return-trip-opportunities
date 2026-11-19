import { supabase } from '@/integrations/supabase/client';
export async function deleteOwnPost(id: string, owner: string) {
  const session = await supabase.auth.getUser();
  if (!session.data.user || session.data.user.id !== owner) throw new Error('OWNER_ONLY');
  const result = await supabase.from('posts').delete().eq('id', id).eq('user_id', owner).select('id');
  if (result.error) throw result.error;
  if (!result.data?.some(row => row.id === id)) throw new Error('NOT_DELETED');
}