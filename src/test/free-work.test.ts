import { describe, expect, it } from 'vitest';
import { FREE_WORK_CATEGORIES, FREE_WORK_FIRST_MATCHES, freeWorkMatch, freeWorkNames } from '@/lib/free-work';
describe('four free home work boxes', () => {
  it('provides all eight supplied initial occupations', () => { expect([...FREE_WORK_CATEGORIES]).toEqual(['ప్లంబర్', 'ఎలక్ట్రీషియన్', 'షాప్ కీపర్', 'సాఫ్ట్వేర్ ఇంజనీర్', 'డ్రైవర్', 'మేస్త్రీ', 'పెయింటర్', 'కార్పెంటర్']); });
  it('adds new occupations without repeating an existing occupation', () => { const names = freeWorkNames([{ name: 'plumber' }, { name: 'వంట పని' }]); expect(names).toHaveLength(9); expect(names).toContain('వంట పని'); });
  it('matches opposite work in exactly the same area and occupation', () => { const a = { section: 'work-wanted' as const, category: 'ప్లంబర్', area: 'చిత్తూరు' }; expect(freeWorkMatch(a, { section: 'work-offered', category: 'plumber', area: 'చిత్తూరు' })).toBe(true); expect(freeWorkMatch(a, { section: 'work-offered', category: 'driver', area: 'చిత్తూరు' })).toBe(false); expect(freeWorkMatch(a, { section: 'work-offered', category: 'plumber', area: 'తిరుపతి' })).toBe(false); });
  it('keeps the first five genuine matches', () => { expect(FREE_WORK_FIRST_MATCHES).toBe(5); });
});