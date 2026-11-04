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
});