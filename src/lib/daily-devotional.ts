export function indianDay(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const value = (type: string) => parts.find(part => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

export function dailyDevotionalIndex(date: Date, count: number): number {
  if (count < 1) return 0;
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return Math.floor(Date.UTC(value('year'), value('month') - 1, value('day')) / 86400000) % count;
}
/** Next image to try after one fails; null once every bundled image has failed, so the browser never loops. */
export function devotionalFallback(failed: string, images: string[], index: number, tried: string[]): string | null {
  const order = [...images.slice(index), ...images.slice(0, index)];
  return order.find(src => src !== failed && !tried.includes(src)) ?? null;
}
