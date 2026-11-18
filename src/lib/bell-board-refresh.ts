export const BELL_BOARD_REFRESH_MS = 2000;
// Area is an optional display filter, never a device-local visibility boundary.
export function bellBoardArea(filterEnabled: boolean, area: string) {
  return filterEnabled ? area.trim() : '';
}