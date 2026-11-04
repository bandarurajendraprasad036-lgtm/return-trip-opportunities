/** Point 9: suppress bell sound from exactly 20:30 in India. Morning restart is not yet specified. */
export function isBellNight(date: Date): boolean {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone:'Asia/Kolkata', hour:'2-digit', minute:'2-digit', hourCycle:'h23' }).formatToParts(date);
  const value = (type: string) => Number(parts.find(p => p.type === type)?.value ?? 0);
  return value('hour') * 60 + value('minute') >= 20 * 60 + 30;
}