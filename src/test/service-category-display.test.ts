import { describe, expect, it } from 'vitest';
import { resolveServiceCategory, serviceCategoryCount } from '@/lib/service-category-display';
const names = ['ప్లంబర్', 'ఎలక్ట్రీషియన్', 'షాప్ కీపర్', 'సాఫ్ట్వేర్ ఇంజనీర్', 'డ్రైవర్'];
describe('service category rules', () => {
  it('recognizes an existing category across supplied spellings', () => {
    expect(resolveServiceCategory('ఎలక్ట్రిషియన్', names)).toEqual({ name: 'ఎలక్ట్రీషియన్', exists: true });
    expect(resolveServiceCategory('plumber', names).exists).toBe(true);
  });
  it('corrects a unique small spelling mistake without inventing new occupations', () => {
    expect(resolveServiceCategory('plumbr', names)).toEqual({ name: 'ప్లంబర్', exists: true });
    expect(resolveServiceCategory('వంట పని', names)).toEqual({ name: 'వంట పని', exists: false });
  });
  it('counts real same-category rows only and does not double count a row', () => {
    const rows = [{ id: '1', source: 'entry', category: 'plumber' }, { id: '1', source: 'entry', category: 'plumber' }, { id: '2', source: 'post', category: 'driver' }];
    expect(serviceCategoryCount(rows, 'ప్లంబర్')).toBe(1);
    expect(serviceCategoryCount(rows, 'ఎలక్ట్రీషియన్')).toBe(0);
  });
});describe('bell list grouping', () => {
  it('puts each real person once under their category, in category order', async () => {
    const { groupRingersByCategory } = await import('@/lib/service-category-display');
    const rows = [{ id: '1', source: 'interest', category: 'electrician' }, { id: '2', source: 'entry', category: 'plumber' }, { id: '2', source: 'entry', category: 'plumber' }];
    const groups = groupRingersByCategory(rows, ['ప్లంబర్', 'ఎలక్ట్రీషియన్', 'డ్రైవర్']);
    expect(groups.map(g => [g.category, g.rows.length])).toEqual([['ప్లంబర్', 1], ['ఎలక్ట్రీషియన్', 1]]);
  });
});
