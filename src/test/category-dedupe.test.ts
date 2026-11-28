import { expect, it } from 'vitest';
import { categoryNames, uniqueCategoryRows } from '@/lib/discovery-categories';

it('shows a category once even when saved in Telugu and English', () => {
  expect(categoryNames(['plumber', 'electrician'], [{ name: 'ప్లంబర్' }, { name: 'ఎలక్ట్రీషియన్' }, { name: 'వెల్డింగ్' }])).toEqual(['plumber', 'electrician', 'వెల్డింగ్']);
  expect(uniqueCategoryRows([{ id: '1', name: 'ప్లంబర్' }, { id: '2', name: 'Plumber' }, { id: '3', name: ' ప్లంబర్ ' }]).map(row => row.id)).toEqual(['1']);
});
