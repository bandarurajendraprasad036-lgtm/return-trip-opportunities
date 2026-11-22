export function bellDateTime(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const day = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date);
  return `${day} · ${time}`;
}

export function postingLimit(error: unknown): 1 | 5 | 10 | null {
  const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : String(error);
  if (message.includes('FREE_ONE_POST_LIMIT')) return 1;
  if (message.includes('MONTHLY_POST_LIMIT_10')) return 10;
  if (message.includes('MONTHLY_POST_LIMIT_5')) return 5;
  return null;
}