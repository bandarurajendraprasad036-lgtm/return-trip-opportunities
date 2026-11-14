import { expect, it } from 'vitest';
import { canOpenWorkArea, selectedWorkArea } from '@/lib/work-area';
it('adds one separator after selecting a long village name without splitting words', () => {
  expect(selectedWorkArea('ఇబ్రహీంపట్నం')).toBe('ఇబ్రహీంపట్నం / ');
  expect(selectedWorkArea('పెద్ద ఇబ్రహీంపట్నం')).toBe('పెద్ద ఇబ్రహీంపట్నం / ');
  expect(selectedWorkArea('ఇబ్రహీంపట్నం / ')).toBe('ఇబ్రహీంపట్నం / ');
});
it('locks all four work/service choices until a village or ward is entered', () => {
  expect(canOpenWorkArea('')).toBe(false);
  expect(canOpenWorkArea('  /  ')).toBe(false);
  expect(canOpenWorkArea('ఇబ్రహీంపట్నం')).toBe(true);
  expect(canOpenWorkArea('ఇబ్రహీంపట్నం / కొత్త వాడ')).toBe(true);
});