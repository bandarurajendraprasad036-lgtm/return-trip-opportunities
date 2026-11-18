import { expect, it } from 'vitest';
import { BELL_BOARD_REFRESH_MS, bellBoardArea } from '@/lib/bell-board-refresh';
it('saved device area never hides another phone bell by default', () => {
  expect(bellBoardArea(false, 'Garmela / mancherial')).toBe('');
});
it('only explicit area selection filters the anonymous display', () => {
  expect(bellBoardArea(true, ' Garmela ')).toBe('Garmela');
});
it('cross-device boards refresh within two seconds', () => {
  expect(BELL_BOARD_REFRESH_MS).toBe(2000);
});