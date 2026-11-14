import { expect, it } from 'vitest';
import { selectedWorkArea } from '@/lib/work-area';
it('adds one separator after selecting a long village name without splitting words', () => {
  expect(selectedWorkArea('ఇబ్రహీంపట్నం')).toBe('ఇబ్రహీంపట్నం / ');
  expect(selectedWorkArea('పెద్ద ఇబ్రహీంపట్నం')).toBe('పెద్ద ఇబ్రహీంపట్నం / ');
  expect(selectedWorkArea('ఇబ్రహీంపట్నం / ')).toBe('ఇబ్రహీంపట్నం / ');
});