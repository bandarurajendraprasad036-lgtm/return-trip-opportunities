import { pushFailure, pushPolicy } from './push-rules';
import { phoneNoticeData } from './phone-notice';

export async function dispatchPush() {
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  const expiredCalls = await db.rpc('expire_app_calls');
  if (expiredCalls.error) throw expiredCalls.error;
  const {cleanupExpiredEvidence}=await import('./evidence-cleanup.server');
  await cleanupExpiredEvidence();
  const key = process.env['LOVABLE_API_KEY']; const connection = process.env['FIREBASE_MESSAGING_API_KEY'];
  if (!key || !connection) throw new Error('Push connection not configured');
  const expiredGroups = await db.rpc('cleanup_expired_bell_groups');
  if (expiredGroups.error) throw expiredGroups.error;
  const { cleanupRemovedAccountFiles } = await import('./storage-cleanup.server');
  await cleanupRemovedAccountFiles(db).catch(error => console.error('removed account file cleanup failed', error));
  const mainBell = await db.rpc('dispatch_main_bell_runs');
  if (mainBell.error) throw mainBell.error;
  const dailyBoard = await db.rpc('dispatch_daily_referral_board');
  const freeWork = await db.rpc('dispatch_free_work_notices');
  if (freeWork.error) throw freeWork.error;
  if (dailyBoard.error) throw dailyBoard.error;
  const vip = await db.rpc('vip_daily_reconcile');
  if (vip.error) throw vip.error;
  const requests=await db.rpc('dispatch_program_requests');
  if(requests.error)throw requests.error;
  const released=await db.rpc('dispatch_visible_post_matches');
  if(released.error)throw released.error;
  const approximate = await db.rpc('dispatch_approximate_route_alerts');
  if (approximate.error) throw approximate.error;
  const availability = await db.rpc('dispatch_vehicle_availability');
  if (availability.error) throw availability.error;
  const claimed = await db.rpc('claim_push_deliveries');
  if (claimed.error) throw claimed.error;
  const rows = claimed.data ?? [];
  for (const row of rows) {
    const [device, prefs, notice, eligibility] = await Promise.all([
      db.from('push_devices').select('token,sound_enabled').eq('id', row.device_id).maybeSingle(),
      db.from('notification_preferences').select('*').eq('user_id', row.user_id).maybeSingle(),
      db.from('notifications').select('id,is_read,message,vehicle_bell,post_id').eq('id', row.notification_id).maybeSingle(),
      db.rpc('notification_delivery_allowed', { _user: row.user_id, _notice: row.notification_id }),
    ]);
    if (device.error || prefs.error || notice.error || eligibility.error) throw device.error ?? prefs.error ?? notice.error ?? eligibility.error;
    const policy = pushPolicy(new Date(), prefs.data, device.data?.sound_enabled ?? false);
    if (!eligibility.data || !device.data || !notice.data || !policy.allowed) {
      const skipped = await db.from('push_deliveries').update({ status: 'skipped', updated_at: new Date().toISOString() }).eq('id', row.id);
      if (skipped.error) throw skipped.error;
      continue;
    }
    const route = notice.data.post_id ? await db.from('posts').select('module,from_place,to_place').eq('id', notice.data.post_id).maybeSingle() : null;
    if (route?.error) throw route.error;
    const safeData = phoneNoticeData(notice.data, route?.data?.module === 'vehicle' ? route.data : null);
    let status = 503, body = '';
    try {
      const response = await fetch('https://connector-gateway.lovable.dev/firebase_messaging/v1/projects/_/messages:send', {
        method: 'POST', headers: { Authorization: `Bearer ${key}`, 'X-Connection-Api-Key': connection, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: { token: device.data.token, data: { ...safeData, silent: String(policy.silent) }, webpush: { headers: { TTL: '300', Urgency: 'high' } } } }),
      });
      status = response.status;
      if (!response.ok) { body = await response.text(); console.error(`FCM send failed [${status}]: ${body.replaceAll(device.data.token, '[device]')}`); }
    } catch { body = 'Network unavailable'; }
    const failure = pushFailure(status, body);
    if (failure.stale) {
      const removed = await db.from('push_devices').delete().eq('id', row.device_id);
      if (removed.error) throw removed.error;
      continue;
    }
    const result = await db.from('push_deliveries').update({ status: status >= 200 && status < 300 ? 'accepted' : failure.retry && row.attempts < 5 ? 'pending' : 'failed', provider_status: status, updated_at: new Date().toISOString(), available_at: new Date(Date.now() + Math.min(3600, 60 * 2 ** row.attempts) * 1000).toISOString() }).eq('id', row.id);
    if (result.error) throw result.error;
  }
  return { processed: rows.length };
}