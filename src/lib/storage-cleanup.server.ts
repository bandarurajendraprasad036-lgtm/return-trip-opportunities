import type { SupabaseClient } from '@supabase/supabase-js';

// Removes files of administrator-removed accounts queued by admin_manage_account.
export async function cleanupRemovedAccountFiles(db: SupabaseClient) {
  const queued = await db.from('storage_cleanup_queue').select('id,bucket,prefix').is('processed_at', null).limit(20);
  if (queued.error) throw queued.error;
  for (const job of queued.data ?? []) {
    const clean = async (prefix: string): Promise<void> => {
      for (let round = 0; round < 50; round++) {
        const listed = await db.storage.from(job.bucket).list(prefix, { limit: 100 });
        if (listed.error) throw listed.error;
        const files = listed.data.filter(item => item.id).map(item => `${prefix}/${item.name}`);
        for (const folder of listed.data.filter(item => !item.id)) await clean(`${prefix}/${folder.name}`);
        if (!files.length) return;
        const removed = await db.storage.from(job.bucket).remove(files);
        if (removed.error) throw removed.error;
      }
    };
    await clean(job.prefix);
    await db.from('storage_cleanup_queue').update({ processed_at: new Date().toISOString() }).eq('id', job.id);
  }
}
