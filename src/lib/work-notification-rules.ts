export function notificationWindowOpen(now: Date, timezone = 'Asia/Kolkata') {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const hour = Number(parts.find(part => part.type === 'hour')?.value);
  return hour >= 9 && hour < 20;
}