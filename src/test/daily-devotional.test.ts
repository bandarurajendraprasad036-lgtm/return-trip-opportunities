import { describe, expect, it } from 'vitest';
import { dailyDevotionalIndex, indianDay } from '@/lib/daily-devotional';
describe('daily devotional selection', () => {
  it('uses Indian dates for admin schedules', () => {
    expect(indianDay(new Date('2026-11-04T18:29:59Z'))).toBe('2026-11-04');
    expect(indianDay(new Date('2026-11-04T18:30:00Z'))).toBe('2026-11-05');
  });
  it('keeps the same image for an Indian calendar day', () => {
    expect(dailyDevotionalIndex(new Date('2026-11-03T18:30:00Z'), 3)).toBe(dailyDevotionalIndex(new Date('2026-11-04T18:29:59Z'), 3));
  });
  it('changes the image at the next Indian midnight', () => {
    const current = dailyDevotionalIndex(new Date('2026-11-04T18:29:59Z'), 3);
    expect(dailyDevotionalIndex(new Date('2026-11-04T18:30:00Z'), 3)).toBe((current + 1) % 3);
  });
});describe('daily devotional around India midnight', () => {
  const at = (iso: string) => dailyDevotionalIndex(new Date(iso), 3);
  it('just before midnight still shows the old day image', () => {
    expect(at('2026-11-04T18:29:59.999Z')).toBe(at('2026-11-04T06:00:00Z'));
  });
  it('just after midnight shows the new day image', () => {
    expect(at('2026-11-04T18:30:00.001Z')).not.toBe(at('2026-11-04T18:29:59.999Z'));
  });
  it('the new image stays the same until the day ends', () => {
    const start = at('2026-11-04T18:30:00Z');
    for (let m = 0; m < 24 * 60; m += 30) expect(at(new Date(Date.parse('2026-11-04T18:30:00Z') + m * 60000).toISOString())).toBe(start);
    expect(at('2026-11-05T18:29:59.999Z')).toBe(start);
    expect(at('2026-11-05T18:30:00Z')).not.toBe(start);
  });
});
