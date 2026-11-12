import { inQuietHours } from './notification-rules';
import { isBellNight } from './bell-rules';
import { notificationWindowOpen } from './work-notification-rules';

export function pushPolicy(now: Date, preference: { enabled?: boolean; timezone?: string; quiet_start?: string | null; quiet_end?: string | null } | null, sound: boolean) {
  return { allowed: notificationWindowOpen(now, preference?.timezone ?? 'Asia/Kolkata') && preference?.enabled !== false && !inQuietHours(now, preference?.timezone ?? 'Asia/Kolkata', preference?.quiet_start ?? null, preference?.quiet_end ?? null), silent: !sound || isBellNight(now) };
}
export function pushFailure(status: number, body: string) {
  let code = '';
  try { const data = JSON.parse(body); code = data.error?.details?.find((d: { errorCode?: string }) => d.errorCode)?.errorCode ?? ''; } catch { /* Provider may return plain text. */ }
  return { stale: code === 'UNREGISTERED' || code === 'INVALID_ARGUMENT', retry: status === 429 || status >= 500 };
}