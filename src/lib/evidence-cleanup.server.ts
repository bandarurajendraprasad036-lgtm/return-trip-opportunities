export async function cleanupExpiredEvidence() {
  const {supabaseAdmin:db}=await import('@/integrations/supabase/client.server');
  const expired=await db.from('post_sharing_evidence').select('id,paths').lte('expires_at',new Date().toISOString()).neq('paths',[]).order('expires_at').limit(20);
  if(expired.error)throw expired.error;
  for(const row of expired.data??[]){if(!row.paths.length)continue;const removed=await db.storage.from('sharing-evidence').remove(row.paths);if(removed.error)throw removed.error;const cleared=await db.from('post_sharing_evidence').update({paths:[]}).eq('id',row.id);if(cleared.error)throw cleared.error;}
  const program=await db.from('program_evidence').select('id,paths').lte('expires_at',new Date().toISOString()).neq('paths',[]).limit(20);
  if(program.error)throw program.error;
  for(const row of program.data??[]){const removed=await db.storage.from('sharing-evidence').remove(row.paths);if(removed.error)throw removed.error;const cleared=await db.from('program_evidence').update({paths:[]}).eq('id',row.id);if(cleared.error)throw cleared.error;}
}