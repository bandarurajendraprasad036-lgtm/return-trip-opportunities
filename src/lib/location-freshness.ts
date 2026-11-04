/** Latest vehicle requirement: only the actual last-position time, no age labels. */
export function lastPositionTime(updatedAt: string | null, timezone: string): string | null {
  if (!updatedAt) return null;
  const time = new Date(updatedAt);
  if (!Number.isFinite(time.getTime())) return null;
  return new Intl.DateTimeFormat('te-IN', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).format(time);
}