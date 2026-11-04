import { describe,expect,it } from 'vitest';
import { inQuietHours,effectiveDailyLimit } from '@/lib/notification-rules';
describe('Account notification controls',()=>{
  it('uses local timezone before midnight',()=>expect(inQuietHours(new Date('2026-11-04T15:00:00Z'),'Asia/Kolkata','20:30','07:00')).toBe(true));
  it('keeps overnight quiet after midnight',()=>expect(inQuietHours(new Date('2026-11-04T20:00:00Z'),'Asia/Kolkata','20:30','07:00')).toBe(true));
  it('ends quiet at the selected morning time',()=>expect(inQuietHours(new Date('2026-11-05T01:30:00Z'),'Asia/Kolkata','20:30','07:00')).toBe(false));
  it('retains free maximum three and allows a lower cap',()=>{expect(effectiveDailyLimit(false,100)).toBe(3);expect(effectiveDailyLimit(false,1)).toBe(1);});
});