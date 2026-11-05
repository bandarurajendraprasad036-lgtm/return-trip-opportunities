import { pushFailure, pushPolicy } from './push-rules';

export async function dispatchPush() {
  const key = process.env['LOVABLE_API_KEY']; const connection = process.env['FIREBASE_MESSAGING_API_KEY'];
  if (!key || !connection) throw new Error('Push connection not configured');
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  const claimed = await db.rpc('claim_push_deliveries');
  if (claimed.error) throw claimed.error;
  const rows = claimed.data ?? [];
  for (const row of rows) {
    const [device, prefs, notice] = await Promise.all([
      db.from('push_devices').select('token,sound_enabled').eq('id', row.device_id).maybeSingle(),
      db.from('notification_preferences').select('*').eq('user_id', row.user_id).maybeSingle(),
      db.from('notifications').select('id,is_read').eq('id', row.notification_id).maybeSingle(),
    ]);
    if (device.error || prefs.error || notice.error) throw device.error ?? prefs.error ?? notice.error;
    const policy = pushPolicy(new Date(), prefs.data, device.data?.sound_enabled ?? false);
    if (!device.data || !notice.data || notice.data.is_read || !policy.allowed) {
      const skipped = await db.from('push_deliveries').update({ status: 'skipped', updated_at: new Date().toISOString() }).eq('id', row.id);
      if (skipped.error) throw skipped.error;
      continue;
    }
    let status = 503, body = '';
    try {
      const response = await fetch('https://connector-gateway.lovable.dev/firebase_messaging/v1/projects/_/messages:send', {
        method: 'POST', headers: { Authorization: `Bearer ${key}`, 'X-Connection-Api-Key': connection, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: { token: device.data.token, data: { id: row.notification_id, silent: String(policy.silent) }, webpush: { headers: { TTL: '300', Urgency: 'high' } } } }),
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